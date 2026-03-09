import { DataTypes, Model } from "sequelize";
import sequelize from "../db.js";

interface PropertyAttributes {
  id?: string;
  name: string;
  address?: string;
  notes?: string;
  startDate: string;
  archived?: boolean;
}

export class Property
  extends Model<PropertyAttributes>
  implements PropertyAttributes
{
  public id!: string;
  public name!: string;
  public address!: string;
  public notes!: string;
  public startDate!: string;
  public archived!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Property.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    archived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "Property",
  },
);
