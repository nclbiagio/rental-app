import { Router, Request, Response } from "express";
import {
  Property,
  MonthRecord,
  Expense,
  ExpenseCategory,
} from "../models/index.js";
import { Op } from "sequelize";
import { validate } from "../middleware/validate.js";
import {
  createMonthSchema,
  updateMonthSchema,
  createExpenseSchema,
  updateExpenseSchema,
} from "../validators/index.js";

const router = Router({ mergeParams: true }); // To access propId from parent router if mounted differently, or we can just use the path

// Middleware to ensure property exists
const checkPropertyExists = async (req: Request, res: Response, next: any) => {
  try {
    const property = await Property.findByPk(req.params.propId as string);
    if (!property) {
      return res.error(404, "NOT_FOUND", "Proprietà non trovata");
    }
    (req as any).property = property;
    next();
  } catch (error) {
    next(error);
  }
};

router.use("/:propId/months", checkPropertyExists);
router.use("/:propId/stats", checkPropertyExists);

// Helpers
const calculateNetResult = (
  agencyNetIncome: number | string,
  expenses: any[],
) => {
  const income =
    typeof agencyNetIncome === "string"
      ? parseFloat(agencyNetIncome)
      : agencyNetIncome;
  const totalExpenses = expenses.reduce((sum, exp) => {
    const amount =
      typeof exp.amount === "string" ? parseFloat(exp.amount) : exp.amount;
    return sum + amount;
  }, 0);
  return income - totalExpenses;
};

// GET /api/properties/:propId/months
router.get("/:propId/months", async (req: Request, res: Response, next) => {
  try {
    const { propId } = req.params;
    const { year, from, to } = req.query;

    const whereClause: any = { propertyId: propId };

    if (year) {
      whereClause.year = parseInt(year as string, 10);
    } else if (from && to) {
      const [fromYear, fromMonth] = (from as string).split("-").map(Number);
      const [toYear, toMonth] = (to as string).split("-").map(Number);
      // Complex condition for from/to
      whereClause[Op.or] = [
        {
          year: { [Op.gt]: fromYear, [Op.lt]: toYear },
        },
        {
          year: fromYear,
          month: { [Op.gte]: fromMonth },
        },
        {
          year: toYear,
          month: { [Op.lte]: toMonth },
        },
      ];
      // Edge case: same year
      if (fromYear === toYear) {
        whereClause[Op.or] = [
          {
            year: fromYear,
            month: { [Op.between]: [fromMonth, toMonth] },
          },
        ];
      }
    }

    const months = await MonthRecord.findAll({
      where: whereClause,
      include: [
        {
          model: Expense,
          include: [ExpenseCategory],
        },
      ],
      order: [
        ["year", "DESC"],
        ["month", "DESC"],
      ],
    });

    // Calculate historical average
    const allMonths = await MonthRecord.findAll({
      where: { propertyId: propId },
      attributes: ["agencyNetIncome"],
    });
    const totalHistoricalIncome = allMonths.reduce(
      (sum, m) => sum + parseFloat(m.agencyNetIncome as any),
      0,
    );
    const avgHistoricalIncome =
      allMonths.length > 0 ? totalHistoricalIncome / allMonths.length : 0;

    const result = months.map((m: any) => {
      const plain = m.get({ plain: true });
      const income = parseFloat(plain.agencyNetIncome);
      plain.netResult = calculateNetResult(income, plain.Expenses || []);
      plain.avgDeviation = income - avgHistoricalIncome;
      return plain;
    });

    res.success(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/properties/:propId/months
router.post(
  "/:propId/months",
  validate(createMonthSchema),
  async (req: Request, res: Response, next) => {
    try {
      const { propId } = req.params;
      const { year, month, agencyNetIncome, notes } = req.body;

      const existing = await MonthRecord.findOne({
        where: { propertyId: propId, year, month },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          error: {
            code: "DUPLICATE_MONTH",
            message: "Mese già esistente per questa proprietà",
          },
        });
      }

      const newMonth = await MonthRecord.create({
        propertyId: propId as string,
        year,
        month,
        agencyNetIncome,
        notes,
      });

      // Generate recurring expenses
      const recurringCategories = await ExpenseCategory.findAll({
        where: { propertyId: propId, isRecurring: true },
      });

      if (recurringCategories.length > 0) {
        const expensesToCreate = recurringCategories
          .filter(
            (c) =>
              c.recurringAmount !== null && c.recurringAmount !== undefined,
          )
          .map((c) => ({
            monthRecordId: newMonth.id,
            categoryId: c.id,
            amount: c.recurringAmount,
            description: `Spesa ricorrente: ${c.name}`,
          }));

        if (expensesToCreate.length > 0) {
          await Expense.bulkCreate(expensesToCreate);
        }
      }

      const monthWithData = await MonthRecord.findByPk(newMonth.id, {
        include: [{ model: Expense, include: [ExpenseCategory] }],
      });

      res.success(monthWithData);
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/properties/:propId/months/:id
router.get("/:propId/months/:id", async (req: Request, res: Response, next) => {
  try {
    const month = await MonthRecord.findOne({
      where: { id: req.params.id, propertyId: req.params.propId },
      include: [{ model: Expense, include: [ExpenseCategory] }],
    });

    if (!month) return res.error(404, "NOT_FOUND", "Mese non trovato");

    res.success(month);
  } catch (error) {
    next(error);
  }
});

// PUT /api/properties/:propId/months/:id
router.put(
  "/:propId/months/:id",
  validate(updateMonthSchema),
  async (req: Request, res: Response, next) => {
    try {
      const month = await MonthRecord.findOne({
        where: { id: req.params.id, propertyId: req.params.propId },
      });

      if (!month) return res.error(404, "NOT_FOUND", "Mese non trovato");

      const { year, month: monthNum, agencyNetIncome, notes } = req.body;

      // Check if changing to a month/year that already exists (and is not this one)
      if (
        (year && year !== month.year) ||
        (monthNum && monthNum !== month.month)
      ) {
        const existing = await MonthRecord.findOne({
          where: {
            propertyId: req.params.propId,
            year: year || month.year,
            month: monthNum || month.month,
          },
        });
        if (existing) {
          return res.status(409).json({
            success: false,
            error: {
              code: "DUPLICATE_MONTH",
              message: "Mese già esistente per questa proprietà",
            },
          });
        }
      }

      await month.update({
        year: year ?? month.year,
        month: monthNum ?? month.month,
        agencyNetIncome: agencyNetIncome ?? month.agencyNetIncome,
        notes: notes ?? month.notes,
      });

      res.success(month);
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/properties/:propId/months/:monthId/expenses
router.post(
  "/:propId/months/:monthId/expenses",
  validate(createExpenseSchema),
  async (req: Request, res: Response, next) => {
    try {
      const month = await MonthRecord.findOne({
        where: { id: req.params.monthId, propertyId: req.params.propId },
      });
      if (!month) return res.error(404, "NOT_FOUND", "Mese non trovato");

      const { categoryId, amount, description } = req.body;

      const expense = await Expense.create({
        monthRecordId: month.id,
        categoryId: categoryId || null,
        amount,
        description,
      });

      res.success(expense);
    } catch (error) {
      next(error);
    }
  },
);

// PUT /api/properties/:propId/months/:monthId/expenses/:id
router.put(
  "/:propId/months/:monthId/expenses/:id",
  validate(updateExpenseSchema),
  async (req: Request, res: Response, next) => {
    try {
      const expense = await Expense.findOne({
        where: { id: req.params.id, monthRecordId: req.params.monthId },
      });
      if (!expense) return res.error(404, "NOT_FOUND", "Spesa non trovata");

      const { categoryId, amount, description } = req.body;
      await expense.update({
        categoryId: categoryId !== undefined ? categoryId : expense.categoryId,
        amount: amount !== undefined ? amount : expense.amount,
        description:
          description !== undefined ? description : expense.description,
      });

      res.success(expense);
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /api/properties/:propId/months/:monthId/expenses/:id
router.delete(
  "/:propId/months/:monthId/expenses/:id",
  async (req: Request, res: Response, next) => {
    try {
      const expense = await Expense.findOne({
        where: { id: req.params.id, monthRecordId: req.params.monthId },
      });
      if (!expense) return res.error(404, "NOT_FOUND", "Spesa non trovata");

      await expense.destroy();
      res.success({ message: "Spesa eliminata" });
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/properties/:propId/stats
router.get("/:propId/stats", async (req: Request, res: Response, next) => {
  try {
    const { propId } = req.params;
    const months = await MonthRecord.findAll({
      where: { propertyId: propId },
      include: [{ model: Expense, include: [ExpenseCategory] }],
      order: [
        ["year", "ASC"],
        ["month", "ASC"],
      ],
    });

    if (months.length === 0) {
      return res.success({
        allTimeAvg: 0,
        last12Avg: 0,
        currentYearTotal: 0,
        currentYearNetTotal: 0,
        bestMonth: null,
        worstMonth: null,
        expensesByCategory: [],
        monthlyTrend: [],
      });
    }

    let totalNet = 0;
    let bestMonth: any = null;
    let worstMonth: any = null;
    let currentYearTotal = 0;
    let currentYearNetTotal = 0;

    let last12Sum = 0;
    const last12Months = months.slice(-12);

    const categoryMap: Record<string, number> = {};
    const monthlyTrend: any[] = [];

    const currentYear = new Date().getFullYear();

    months.forEach((m) => {
      const plain = m.get({ plain: true });
      const income = parseFloat(plain.agencyNetIncome as any);
      let expTotal = 0;

      (plain as any).Expenses?.forEach((exp: any) => {
        const amt = parseFloat(exp.amount);
        expTotal += amt;
        const catName = exp.ExpenseCategory?.name || "Senza Categoria";
        categoryMap[catName] = (categoryMap[catName] || 0) + amt;
      });

      const net = income - expTotal;
      totalNet += net;

      monthlyTrend.push({
        id: plain.id,
        year: plain.year,
        month: plain.month,
        agencyNetIncome: income,
        totalExpenses: expTotal,
        netResult: net,
      });

      if (!bestMonth || net > bestMonth.amount)
        bestMonth = { year: plain.year, month: plain.month, amount: net };
      if (!worstMonth || net < worstMonth.amount)
        worstMonth = { year: plain.year, month: plain.month, amount: net };

      if (plain.year === currentYear) {
        currentYearTotal += income;
        currentYearNetTotal += net;
      }
    });

    last12Months.forEach((m) => {
      const plain = m.get({ plain: true });
      const income = parseFloat(plain.agencyNetIncome as any);
      const expTotal = ((plain as any).Expenses || []).reduce(
        (sum: number, exp: any) => sum + parseFloat(exp.amount),
        0,
      );
      last12Sum += income - expTotal;
    });

    const totalExpensesEver = Object.values(categoryMap).reduce(
      (a, b) => a + b,
      0,
    );
    const expensesByCategory = Object.keys(categoryMap)
      .map((cat) => ({
        categoryName: cat,
        total: categoryMap[cat],
        percentage:
          totalExpensesEver > 0
            ? (categoryMap[cat] / totalExpensesEver) * 100
            : 0,
      }))
      .sort((a, b) => b.total - a.total);

    res.success({
      allTimeAvg: totalNet / months.length,
      last12Avg: last12Months.length > 0 ? last12Sum / last12Months.length : 0,
      currentYearTotal,
      currentYearNetTotal,
      bestMonth,
      worstMonth,
      expensesByCategory,
      monthlyTrend,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
