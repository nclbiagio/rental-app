import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const dialect = process.env.DB_DIALECT || "sqlite";
const env = process.env.NODE_ENV || "development"; // 🚀 Recupera l'ambiente

let sequelize: Sequelize;

if (dialect === "postgres") {
  sequelize = new Sequelize(process.env.DB_URL as string, {
    dialect: "postgres",
    logging: false,
  });
} else if (process.env.NODE_ENV === "vitest") {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: ":memory:",
    logging: false,
  });
} else {
  // 🚀 SEPARAZIONE DEV E PROD PER SQLITE
  const dbPath =
    env === "production" ? "./prod-database.sqlite" : "./dev-database.sqlite";

  // Default to SQLite file in dev
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: dbPath,
    logging: false,
  });
}

export { sequelize };
