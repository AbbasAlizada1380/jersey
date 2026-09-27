// models/pricelist.js
import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";

import Zone from "./Zone.js";
import TransitWay from "./TransitWay.js";
const PriceList = sequelize.define(
  "PriceList",
  {
    zoneId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "zones", // table name
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      comment: "Foreign key referencing Zone",
    },

    range: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: { start: 0, end: 0 },
      validate: {
        hasStartAndEnd(value) {
          if (
            typeof value !== "object" ||
            value.start === undefined ||
            value.end === undefined
          ) {
            throw new Error("range must include 'start' and 'end'.");
          }
        },
      },
      comment: "Weight range {start, end}",
    },

    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Price for the specified range and zone",
    },

    transitId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "transits", // table name
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      comment: "Foreign key referencing Transit",
    },
  },
  {
    tableName: "price_lists",
    timestamps: true,
  }
);

export default PriceList;




// Relations
Zone.hasMany(PriceList, { foreignKey: "zoneId" });
PriceList.belongsTo(Zone, { foreignKey: "zoneId" });

TransitWay.hasMany(PriceList, { foreignKey: "transitId" });
PriceList.belongsTo(TransitWay, { foreignKey: "transitId" });
