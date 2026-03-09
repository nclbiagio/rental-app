import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = (error as any).errors.map((err: any) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        throw new AppError(422, "VALIDATION_ERROR", "Dati non validi", errors);
      }
      next(error);
    }
  };
};
