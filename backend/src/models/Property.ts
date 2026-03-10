import { DataTypes, Model, Sequelize } from "sequelize";

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
  declare id: string;
  declare name: string;
  declare address: string;
  declare notes: string;
  declare startDate: string;
  declare archived: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export const initProperty = (sequelize: Sequelize) => {
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
};
