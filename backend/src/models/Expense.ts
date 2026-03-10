import { DataTypes, Model, Sequelize } from "sequelize";

interface ExpenseAttributes {
  id?: string;
  monthRecordId: string;
  categoryId?: string;
  amount: number;
  description?: string;
}

export class Expense
  extends Model<ExpenseAttributes>
  implements ExpenseAttributes
{
  declare id: string;
  declare monthRecordId: string;
  declare categoryId: string;
  declare amount: number;
  declare description: string;
}

export const initExpense = (sequelize: Sequelize) => {
  Expense.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      monthRecordId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "MonthRecords",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      categoryId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "ExpenseCategories",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Expense",
    },
  );
};
