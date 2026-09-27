import { DataTypes } from "sequelize";
import sequelize from "../dbconnection.js";
import Customer from "./Customer.js";

const Package = sequelize.define(
  "Package",
  {
    receiver: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sender: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    formattedId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    totalWeight: DataTypes.FLOAT,
    piece: DataTypes.INTEGER,
    value: DataTypes.FLOAT,
    location: DataTypes.STRING,
    extraCharges: DataTypes.FLOAT,
    transitWay: DataTypes.STRING,
    OPerKgCash: DataTypes.FLOAT,
    OTotalCash: DataTypes.FLOAT,
    perKgCash: DataTypes.FLOAT,
    totalCash: DataTypes.FLOAT,
    remain: DataTypes.FLOAT,
    received: DataTypes.FLOAT,
    date: DataTypes.DATE,
    run: DataTypes.INTEGER,
    track_number: DataTypes.STRING,

    // --- NEW: ID Document PDF path/URL ---
    idDocumentPath: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Path or URL to ID document PDF file"
    },

    // --- NEW: ID Document metadata (optional) ---
    idDocumentMetadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
      comment: "Metadata about the ID document: {filename, size, uploadedAt, verified, type, expiryDate}",
      get() {
        const raw = this.getDataValue("idDocumentMetadata");
        return raw ? raw : {};
      },
      set(value) {
        if (typeof value === 'object' && value !== null) {
          const metadata = {
            filename: value.filename || null,
            size: value.size || 0,
            uploadedAt: value.uploadedAt || new Date(),
            verified: value.verified || false,
            type: value.type || 'id_card', // id_card, passport, driver_license, etc.
            expiryDate: value.expiryDate || null,
            verifiedBy: value.verifiedBy || null,
            verifiedAt: value.verifiedAt || null
          };
          this.setDataValue("idDocumentMetadata", metadata);
        } else {
          this.setDataValue("idDocumentMetadata", {});
        }
      },
    },

    // --- FIXED packList ---
    packList: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: "List of items: each item contains {description, qty, weight, value}",
      get() {
        const raw = this.getDataValue("packList");
        return raw ? raw : [];
      },
      set(value) {
        // Ensure it's always an array
        if (Array.isArray(value)) {
          this.setDataValue("packList", value);
        } else if (typeof value === "object") {
          this.setDataValue("packList", [value]);
        } else {
          this.setDataValue("packList", []);
        }
      },
    },

    // --- NEW: pieceDetails JSON for individual piece information ---
    pieceDetails: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: "Details for each piece: {1: {weight, height, width, length, dimensionWeight}, 2: {...}}",
      get() {
        const raw = this.getDataValue("pieceDetails");
        return raw ? raw : {};
      },
      set(value) {
        // Ensure it's always an object with piece numbers as keys
        if (typeof value === 'object' && value !== null) {
          // If it's an array, convert to object with indices as keys
          if (Array.isArray(value)) {
            const pieceObject = {};
            value.forEach((piece, index) => {
              pieceObject[index + 1] = {
                weight: piece.weight || 0,
                height: piece.height || 0,
                width: piece.width || 0,
                length: piece.length || 0,
                dimensionWeight: piece.dimensionWeight || 0,
                actualWeight: piece.actualWeight || piece.weight || 0
              };
            });
            this.setDataValue("pieceDetails", pieceObject);
          } else {
            // Already an object, ensure proper structure
            const sanitized = {};
            Object.keys(value).forEach(key => {
              const piece = value[key];
              sanitized[key] = {
                weight: parseFloat(piece.weight) || 0,
                height: parseFloat(piece.height) || 0,
                width: parseFloat(piece.width) || 0,
                length: parseFloat(piece.length) || 0,
                dimensionWeight: parseFloat(piece.dimensionWeight) || 0,
                actualWeight: parseFloat(piece.actualWeight) || parseFloat(piece.weight) || 0
              };
            });
            this.setDataValue("pieceDetails", sanitized);
          }
        } else {
          this.setDataValue("pieceDetails", {});
        }
      },
    },
  },
  {
    tableName: "packages",
    timestamps: true,
  }
);

// ---- ASSOCIATIONS ----
Package.belongsTo(Customer, {
  as: "Sender",
  foreignKey: "sender",
  targetKey: "id",
});

Package.belongsTo(Customer, {
  as: "Receiver",
  foreignKey: "receiver",
  targetKey: "id",
});

export default Package;