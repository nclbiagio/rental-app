import { DataTypes, Model, Sequelize } from "sequelize";

export interface ExpenseCategoryAttributes {
  id?: string;
  propertyId: string;
  name: string;
  isRecurring?: boolean;
  recurringAmount?: number;
}

export class ExpenseCategory
  extends Model<ExpenseCategoryAttributes>
  implements ExpenseCategoryAttributes
{
  declare id: string;
  declare propertyId: string;
  declare name: string;
  declare isRecurring: boolean;
  declare recurringAmount: number;
}

export const initExpenseCategory = (sequelize: Sequelize) => {
  ExpenseCategory.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      propertyId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Properties",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      name: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      isRecurring: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      recurringAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "ExpenseCategory",
    },
  );
};
