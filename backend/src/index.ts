import { app } from "./app.js";
import { sequelize } from "./models/index.js";

const PORT = process.env.PORT || 3000;
const env = process.env.NODE_ENV || "development";

export const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection authenticated.");

    // 🚀 LA PROTEZIONE PER LA PRODUZIONE
    if (env === "development") {
      console.log("🚧 Sincronizzazione schema DB Development");
      //await sequelize.sync({ alter: true });
      await sequelize.sync();
    } else {
      console.log("🚀 Produzione: Sincronizzazione base (senza alter)...");
      // In prod crea solo le tabelle mancanti, ma NON tocca quelle esistenti.
      // Ancora meglio sarebbe usare le Migrations, ma per ora questo ti salva la vita.
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
