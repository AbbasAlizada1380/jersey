import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";

const Customer = sequelize.define(
  "Customer",
  {
    name: DataTypes.STRING,
    address: DataTypes.STRING,
    email: DataTypes.STRING,
    phoneNumber: DataTypes.STRING,
    country: DataTypes.STRING,
    state: DataTypes.STRING,
    city: DataTypes.STRING,
    zipCode: DataTypes.STRING,
  },
  {
    tableName: "customers",
    timestamps: true,
  }
);


export default Customer;
