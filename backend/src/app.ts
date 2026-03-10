import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";
import propertiesRouter from "./routes/properties.js";
import categoriesRouter from "./routes/categories.js";
import monthsRouter from "./routes/months.js";
import dashboardRouter from "./routes/dashboard.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: "http://localhost:4200" }));
app.use(express.json());

// Add custom properties to Express Response
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Response {
      success: (data: any) => void;
      error: (status: number, code: string, message: string) => void;
    }
  }
}

// Standard JSON response formatting middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.success = (data: any) => {
    res.status(200).json({ success: true, data });
  };
  res.error = (status: number, code: string, message: string) => {
    res.status(status).json({ success: false, error: { code, message } });
  };
  next();
});

// Example route
app.get("/api/health", (req: Request, res: Response) => {
  res.success({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/properties", propertiesRouter);
app.use("/api/properties", categoriesRouter);
app.use("/api/properties", monthsRouter);
app.use("/api/dashboard", dashboardRouter);

// Global Error Handler
app.use(errorHandler);

export { app };
