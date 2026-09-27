// models/zone.js
import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";

const Zone = sequelize.define(
  "Zone",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // Array of country names
    countries: {
      type: DataTypes.JSON, // JSON is the safest/most portable way for arrays
      allowNull: false,
      defaultValue: [],
      validate: {
        isArray(value) {
          if (!Array.isArray(value)) {
            throw new Error("countries must be an array.");
          }
        },
      },
    },
  },
  {
    tableName: "zones",
    timestamps: true,
  }
);

export default Zone;
 