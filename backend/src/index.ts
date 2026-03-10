import { app } from "./app.js";
import { sequelize } from "./models/index.js";

const PORT = process.env.PORT || 3000;

export const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection authenticated.");
    await sequelize.sync({ alter: true });

    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (err: any) {
    console.error("Initial database connection error:", err);
    process.exit(1);
  }
};

startServer();
