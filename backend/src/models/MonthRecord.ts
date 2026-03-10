import { DataTypes, Model, Sequelize } from "sequelize";

interface MonthRecordAttributes {
  id?: string;
  propertyId: string;
  year: number;
  month: number;
  agencyNetIncome: number;
  notes?: string;
}

export class MonthRecord
  extends Model<MonthRecordAttributes>
  implements MonthRecordAttributes
{
  declare id: string;
  declare propertyId: string;
  declare year: number;
  declare month: number;
  declare agencyNetIncome: number;
  declare notes: string;
}

export const initMonthRecord = (sequelize: Sequelize) => {
  MonthRecord.init(
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
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      month: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      agencyNetIncome: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "MonthRecord",
      indexes: [
        {
          unique: true,
          fields: ["propertyId", "year", "month"],
        },
      ],
    },
  );
};
