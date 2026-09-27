// models/transit.js
import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";

const TransitWay = sequelize.define(
  "Transit",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Name of the transit point",
    },
  },
  {
    tableName: "transits",
    timestamps: true,
  }
);

export default TransitWay;
