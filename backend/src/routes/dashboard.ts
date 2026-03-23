import { Router, Request, Response } from "express";
import { Property, MonthRecord, Expense } from "../models/index.js";
import type { PropertyHealth } from "@app/shared/types/dashboard.contracts.js";

interface PlainExpense {
  amount: string | number;
}

interface PlainMonthRecord {
  year: number;
  month: number;
  agencyNetIncome: string | number;
  Expenses?: PlainExpense[];
}

interface PlainProperty {
  id: string;
  name: string;
  startDate?: string | null;
  MonthRecords?: PlainMonthRecord[];
}

const router = Router();

// GET /api/dashboard
router.get("/", async (req: Request, res: Response, next) => {
  try {
    const properties = await Property.findAll({
      where: { archived: false },
      include: [
        {
          model: MonthRecord,
          include: [Expense],
        },
      ],
    });

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonthNum = currentDate.getMonth() + 1; // 1-12

    const result = properties.map((p: Property) => {
      const plain = p.get({ plain: true }) as PlainProperty;
      const months = plain.MonthRecords || [];

      let allNet = 0;
      let ytdNetResult = 0;
      let lastMonthNetResult = 0;

      // Identify the conceptual "last month"
      let lastM = currentMonthNum - 1;
      let lastY = currentYear;
      if (lastM === 0) {
        lastM = 12;
        lastY--;
      }

      const existingMonths = new Set<string>();

      months.forEach((m: PlainMonthRecord) => {
        const income = Number(m.agencyNetIncome);
        const exps = (m.Expenses || []).reduce(
          (sum: number, e: PlainExpense) => sum + Number(e.amount),
          0,
        );
        const net = income - exps;

        allNet += net;

        if (m.year === currentYear) {
          ytdNetResult += net;
        }

        if (m.year === lastY && m.month === lastM) {
          lastMonthNetResult = net;
        }

        existingMonths.add(`${m.year}-${m.month}`);
      });

      // Calculate missing months
      const missingMonths: { year: number; month: number }[] = [];
      if (plain.startDate) {
        const start = new Date(plain.startDate);
        let iterY = start.getFullYear();
        let iterM = start.getMonth() + 1;

        while (
          iterY < currentYear ||
          (iterY === currentYear && iterM <= currentMonthNum)
        ) {
          if (!existingMonths.has(`${iterY}-${iterM}`)) {
            missingMonths.push({ year: iterY, month: iterM });
          }
          iterM++;
          if (iterM > 12) {
            iterM = 1;
            iterY++;
          }
        }
      }

      const propertyHealth: PropertyHealth = {
        propertyId: plain.id,
        propertyName: plain.name,
        lastMonthNetResult,
        ytdNetResult,
        avgMonthly: months.length > 0 ? allNet / months.length : 0,
        missingMonths,
        startDate: plain.startDate || null,
      };

      return propertyHealth;
    });

    res.success(result);
  } catch (error) {
    next(error);
  }
});

export default router;
