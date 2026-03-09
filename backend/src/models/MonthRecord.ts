import { DataTypes, Model } from "sequelize";
import sequelize from "../db.js";

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
  public id!: string;
  public propertyId!: string;
  public year!: number;
  public month!: number;
  public agencyNetIncome!: number;
  public notes!: string;
}

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
