import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import {
  UniqueConstraintError,
  ValidationError,
  ForeignKeyConstraintError,
} from "sequelize";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "Errore interno del server";
  let details: any = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof UniqueConstraintError) {
    statusCode = 409;
    code = "DUPLICATE_ENTRY";
    message = "Record duplicato o già esistente";
    details = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err instanceof ValidationError) {
    statusCode = 422;
    code = "VALIDATION_ERROR";
    message = "Errore di validazione nel salvataggio dei dati";
    details = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err instanceof ForeignKeyConstraintError) {
    statusCode = 422;
    code = "FOREIGN_KEY_ERROR";
    message = "Manca una relazione necessaria per salvare il record";
  }

  // Se siamo in dev, stampiamo lo stack trace per debug e/o lo esponiamo
  if (process.env.NODE_ENV === "development" && !err.isOperational) {
    console.error("🔥 Error Catch:");
    console.error(err);
  }

  const errorResponse: any = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details) {
    errorResponse.error.errors = details;
  }

  if (process.env.NODE_ENV === "development" && statusCode === 500) {
    errorResponse.error.stack = err.stack;
  }

  // Assicuriamoci che l'estensione Request globale di res.error se la usi
  return res.status(statusCode).json(errorResponse);
};
