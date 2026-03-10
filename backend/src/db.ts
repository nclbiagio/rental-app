import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const dialect = process.env.DB_DIALECT || "sqlite";

let sequelize: Sequelize;

if (dialect === "postgres") {
  sequelize = new Sequelize(process.env.DB_URL as string, {
    dialect: "postgres",
    logging: false,
  });
} else if (process.env.NODE_ENV === "test") {
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: ":memory:",
    logging: false,
  });
} else {
  // Default to SQLite file in dev
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite",
    logging: false,
  });
}

export { sequelize };
