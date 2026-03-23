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
} else if (env === "vitest") {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: ":memory:",
    logging: false,
  });
} else {
  // 🚀 SEPARAZIONE DEV, PROD E TEST PER SQLITE
  let dbPath = "./dev-database.sqlite"; // Default per lo sviluppo

  if (env === "production") {
    dbPath = "./prod-database.sqlite";
  } else if (env === "test") {
    dbPath = "./test-database.sqlite";
  }

  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: dbPath,
    logging: false,
  });
}

export { sequelize };
