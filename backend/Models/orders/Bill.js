import { DataTypes } from "sequelize";
import sequelize from "../../dbconnection.js";

const Bill = sequelize.define(
  "Bill",
  {
    /* ---------------- Customer type ---------------- */
    customerType: {
      type: DataTypes.ENUM("permanent", "temporary"),
      allowNull: false,
      defaultValue: "temporary",
      comment: "Type of customer this bill belongs to",
    },

    /* ---------------- Payment status ---------------- */
    status: {
      type: DataTypes.ENUM("unpaid", "partial", "paid"),
      allowNull: false,
      defaultValue: "unpaid",
      comment: "Derived from remaind: unpaid = nothing paid, partial = some paid, paid = fully settled",
    },

    /* ---------------- Customer identity ---------------- */
    customer: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Customers",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
      comment: "Customer ID — set for permanent customers, null for temporary",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Customer full name (snapshot for temporary customers)",
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Customer phone number",
    },

    /* ---------------- Money ---------------- */
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
      comment: "Total amount of the bill",
    },
    receipt: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: "Array of payments, e.g. [1000, 2000, 2000]",
    },
    remaind: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
      comment: "Remaining balance = total - sum(receipt)",
    },
  },
  {
    timestamps: true,
    indexes: [
      { fields: ["customerType"] },
      { fields: ["status"] },
      { fields: ["customer"] },
    ],
  }
);

/* =====================================================
   Keep `remaind` and `status` derived from `total` + `receipt`
   so they can never drift out of sync.
   ===================================================== */
Bill.beforeSave((bill) => {
  const total = Number(bill.total) || 0;
  const receipts = Array.isArray(bill.receipt) ? bill.receipt : [];
  const paid = receipts.reduce((sum, n) => sum + (Number(n) || 0), 0);

  bill.remaind = Number((total - paid).toFixed(2));

  if (bill.remaind <= 0) {
    bill.status = "paid";
  } else if (paid > 0) {
    bill.status = "partial";
  } else {
    bill.status = "unpaid";
  }
});

export default Bill;