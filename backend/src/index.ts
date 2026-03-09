import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { sequelize } from "./models/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: "http://localhost:4200" }));
app.use(express.json());

import { Request, Response, NextFunction } from "express";

// Add custom properties to Express Response
declare global {
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

import propertiesRouter from "./routes/properties.js";

// Example route
app.get("/api/health", (req: Request, res: Response) => {
  res.success({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/properties", propertiesRouter);

// Sync DB and Start Server
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection authenticated.");
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  })
  .catch((err: any) => {
    console.error("Initial database connection error:", err);
  });
