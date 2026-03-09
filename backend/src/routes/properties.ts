import { Router, Request, Response } from "express";
import { Property } from "../models/index.js";
import { validate } from "../middleware/validate.js";
import {
  createPropertySchema,
  updatePropertySchema,
} from "../validators/index.js";

const router = Router();

// Middleware to extract property by ID and handle 404
const getPropertyOr404 = async (req: Request, res: Response, next: any) => {
  try {
    const property = await Property.findByPk(req.params.id as string);
    if (!property) {
      return res.error(404, "NOT_FOUND", "Proprietà non trovata");
    }
    (req as any).property = property;
    next();
  } catch (error) {
    next(error);
  }
};

// GET /api/properties
router.get("/", async (req: Request, res: Response, next) => {
  try {
    const includeArchived = req.query.archived === "true";
    const whereClause = includeArchived ? {} : { archived: false };

    const properties = await Property.findAll({ where: whereClause });
    res.success(properties);
  } catch (error) {
    next(error);
  }
});

// POST /api/properties
router.post(
  "/",
  validate(createPropertySchema),
  async (req: Request, res: Response, next) => {
    try {
      const { name, address, notes, startDate } = req.body;

      const newProperty = await Property.create({
        name,
        address,
        notes,
        startDate,
      });
      res.success(newProperty);
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/properties/:id
router.get("/:id", getPropertyOr404, (req: Request, res: Response) => {
  res.success((req as any).property);
});

// PUT /api/properties/:id
router.put(
  "/:id",
  getPropertyOr404,
  validate(updatePropertySchema),
  async (req: Request, res: Response, next) => {
    try {
      const property: Property = (req as any).property;
      const { name, address, notes, startDate } = req.body;

      await property.update({ name, address, notes, startDate });
      res.success(property);
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /api/properties/:id
router.delete(
  "/:id",
  getPropertyOr404,
  async (req: Request, res: Response, next) => {
    try {
      const property: Property = (req as any).property;
      await property.destroy(); // Will cascade based on DB association config
      res.success({ message: "Proprietà eliminata con successo" });
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /api/properties/:id/archive
router.patch(
  "/:id/archive",
  getPropertyOr404,
  async (req: Request, res: Response, next) => {
    try {
      const property: Property = (req as any).property;
      await property.update({ archived: true });
      res.success(property);
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /api/properties/:id/unarchive
router.patch(
  "/:id/unarchive",
  getPropertyOr404,
  async (req: Request, res: Response, next) => {
    try {
      const property: Property = (req as any).property;
      await property.update({ archived: false });
      res.success(property);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
