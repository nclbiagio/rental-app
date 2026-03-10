import { beforeAll, afterAll, afterEach } from "vitest";
import { sequelize } from "../db.js";

beforeAll(async () => {
  // Override db configuration if needed (already handled by passing DB_DIALECT=sqlite on tests run)
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  // Truncate all tables after each test to keep isolation
  await sequelize.truncate({ cascade: true });
});

afterAll(async () => {
  await sequelize.close();
});
