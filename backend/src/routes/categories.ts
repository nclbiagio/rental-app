import { Router, Request, Response } from "express";
import { Property, ExpenseCategory } from "../models/index.js";
import { validate } from "../middleware/validate.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/index.js";

const router = Router();

// Middleware to ensure property exists
const checkPropertyExists = async (req: Request, res: Response, next: any) => {
  try {
    const property = await Property.findByPk(req.params.propId as string);
    if (!property) {
      return res.error(404, "NOT_FOUND", "Proprietà non trovata");
    }
    next();
  } catch (error) {
    next(error);
  }
};

router.use("/:propId/categories", checkPropertyExists);

// GET /api/properties/:propId/categories
router.get("/:propId/categories", async (req: Request, res: Response, next) => {
  try {
    const categories = await ExpenseCategory.findAll({
      where: { propertyId: req.params.propId },
      order: [["name", "ASC"]],
    });
    res.success(categories);
  } catch (error) {
    next(error);
  }
});

// POST /api/properties/:propId/categories
router.post(
  "/:propId/categories",
  validate(createCategorySchema),
  async (req: Request, res: Response, next) => {
    try {
      const { name, isRecurring, recurringAmount } = req.body;

      const newCategory = await ExpenseCategory.create({
        propertyId: req.params.propId as string,
        name,
        isRecurring: isRecurring || false,
        recurringAmount: recurringAmount || null,
      });
      res.success(newCategory);
    } catch (error) {
      next(error);
    }
  },
);

// PUT /api/properties/:propId/categories/:id
router.put(
  "/:propId/categories/:id",
  validate(updateCategorySchema),
  async (req: Request, res: Response, next) => {
    try {
      const category = await ExpenseCategory.findOne({
        where: { id: req.params.id, propertyId: req.params.propId },
      });

      if (!category) {
        return res.error(404, "NOT_FOUND", "Categoria non trovata");
      }

      const { name, isRecurring, recurringAmount } = req.body;

      await category.update({
        name,
        isRecurring:
          isRecurring !== undefined ? isRecurring : category.isRecurring,
        recurringAmount:
          recurringAmount !== undefined
            ? recurringAmount
            : category.recurringAmount,
      });
      res.success(category);
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /api/properties/:propId/categories/:id
router.delete(
  "/:propId/categories/:id",
  async (req: Request, res: Response, next) => {
    try {
      const category = await ExpenseCategory.findOne({
        where: { id: req.params.id, propertyId: req.params.propId },
      });

      if (!category) {
        return res.error(404, "NOT_FOUND", "Categoria non trovata");
      }

      await category.destroy();
      res.success({ message: "Categoria eliminata con successo" });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/properties/:propId/categories/copy-from/:sourcePropId
router.post(
  "/:propId/categories/copy-from/:sourcePropId",
  async (req: Request, res: Response, next) => {
    try {
      const targetPropId = req.params.propId;
      const sourcePropId = req.params.sourcePropId;

      if (targetPropId === sourcePropId) {
        return res.status(422).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Non puoi copiare categorie dalla stessa proprietà",
            errors: [],
          },
        });
      }

      // Verify source property exists
      const sourceProperty = await Property.findByPk(sourcePropId as string);
      if (!sourceProperty) {
        return res.error(404, "NOT_FOUND", "Proprietà sorgente non trovata");
      }

      // Get source categories
      const sourceCategories = await ExpenseCategory.findAll({
        where: { propertyId: sourcePropId },
      });

      if (sourceCategories.length === 0) {
        return res.success({
          copied: 0,
          message: "Nessuna categoria da copiare",
        });
      }

      // Get target categories to avoid duplicates
      const targetCategories = await ExpenseCategory.findAll({
        where: { propertyId: targetPropId },
      });
      const targetCategoryNames = new Set(
        targetCategories.map((c) => c.name.toLowerCase()),
      );

      const categoriesToCreate = sourceCategories
        .filter((c) => !targetCategoryNames.has(c.name.toLowerCase()))
        .map((c) => ({
          propertyId: targetPropId as string,
          name: c.name,
          isRecurring: c.isRecurring,
          recurringAmount: c.recurringAmount,
        }));

      if (categoriesToCreate.length === 0) {
        return res.success({
          copied: 0,
          message: "Tutte le categorie esistono già",
        });
      }

      const createdCategories =
        await ExpenseCategory.bulkCreate(categoriesToCreate);

      res.success({
        copied: createdCategories.length,
        message: `${createdCategories.length} categorie copiate con successo`,
        categories: createdCategories,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
