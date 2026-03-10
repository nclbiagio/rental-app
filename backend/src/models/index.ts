import { sequelize } from "../db.js";
import { Property, initProperty } from "./Property.js";
import { ExpenseCategory, initExpenseCategory } from "./ExpenseCategory.js";
import { MonthRecord, initMonthRecord } from "./MonthRecord.js";
import { Expense, initExpense } from "./Expense.js";

// Init models
initProperty(sequelize);
initExpenseCategory(sequelize);
initMonthRecord(sequelize);
initExpense(sequelize);

// Associations
Property.hasMany(ExpenseCategory, {
  foreignKey: "propertyId",
  onDelete: "CASCADE",
});
ExpenseCategory.belongsTo(Property, { foreignKey: "propertyId" });

Property.hasMany(MonthRecord, {
  foreignKey: "propertyId",
  onDelete: "CASCADE",
});
MonthRecord.belongsTo(Property, { foreignKey: "propertyId" });

MonthRecord.hasMany(Expense, {
  foreignKey: "monthRecordId",
  onDelete: "CASCADE",
});
Expense.belongsTo(MonthRecord, { foreignKey: "monthRecordId" });

ExpenseCategory.hasMany(Expense, {
  foreignKey: "categoryId",
  onDelete: "SET NULL",
});
Expense.belongsTo(ExpenseCategory, { foreignKey: "categoryId" });

export { sequelize, Property, ExpenseCategory, MonthRecord, Expense };
