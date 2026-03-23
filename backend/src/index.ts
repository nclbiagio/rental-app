import { app } from "./app.js";
import { sequelize } from "./models/index.js";
import morgan from "morgan";

const PORT = process.env.PORT || 3000;
const env = process.env.NODE_ENV || "development";

export const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection authenticated.");

    // 🚀 LO SWITCH DI SINCRONIZZAZIONE BASATO SULL'AMBIENTE
    if (env === "test") {
      console.log("🧪 Ambiente E2E Test: Piallo e ricreo il DB da zero!");
      // Usa force: true SOLO nei test per azzerare i dati a ogni avvio di Playwright
      await sequelize.sync({ force: true });
    } else if (env === "development") {
      app.use(morgan("dev"));
      console.log("🚧 Sincronizzazione schema DB Development");
      await sequelize.sync();
    } else {
      app.use(morgan("combined"));
      console.log("🚀 Produzione: Sincronizzazione base (senza alter)...");
      await sequelize.sync();
    }

    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (err: any) {
    console.error("Initial database connection error:", err);
    process.exit(1);
  }
};

startServer();
