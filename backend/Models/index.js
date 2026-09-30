// models/index.js
import sequelize from "../dbconnection.js";

// Import all models
import Staff from "./staff/staff.js";
import SalaryList from "./staff/salary/salaryList.js";
import Attendance from "./staff/salary/Attendence.js";
import Bill from "./orders/Bill.js";
import Order from "./orders/Order.js";
import Customer from "./Customer.js";
import Receipt from "./orders/Receipt.js";

/* ---------- Customer <-> Receipt ---------- */
Customer.hasMany(Receipt, {
  foreignKey: "customer",
  as: "receipts",
  onUpdate: "CASCADE",
  onDelete: "SET NULL",
});

Receipt.belongsTo(Customer, {
  foreignKey: "customer",
  as: "customerInfo",
  onUpdate: "CASCADE",
  onDelete: "SET NULL",
});
/* ---------- Bill <-> Order ----------
   A bill has many orders.
   Each order belongs to one bill (nullable — an order may exist before being attached).
*/
Bill.hasMany(Order, {
  foreignKey: "billNumber",
  as: "orders",
  onUpdate: "CASCADE",
  onDelete: "SET NULL",
});

Order.belongsTo(Bill, {
  foreignKey: "billNumber",
  as: "bill",
  onUpdate: "CASCADE",
  onDelete: "SET NULL",
});
// ✅ KEEP: SalaryList <-> Attendance
SalaryList.hasMany(Attendance, {
  foreignKey: "list",
  as: "attendances",
  onUpdate: "CASCADE",
  onDelete: "CASCADE",
});

Attendance.belongsTo(SalaryList, {
  foreignKey: "list",
  as: "salaryList",
  onUpdate: "CASCADE",
  onDelete: "CASCADE",
});

// ✅ KEEP: Staff <-> Attendance
Staff.hasMany(Attendance, {
  foreignKey: "staffId",
  as: "attendances",
  onUpdate: "CASCADE",
  onDelete: "RESTRICT",
});

Attendance.belongsTo(Staff, {
  foreignKey: "staffId",
  as: "staff",
  onUpdate: "CASCADE",
  onDelete: "RESTRICT",
});
export {
  sequelize,
  Staff,
  SalaryList,
  Attendance,
  Bill,
  Order,
  Customer,
  Receipt
};

export default {
  sequelize,
  Staff,
  SalaryList,
  Attendance,
  Bill,
  Order,
  Customer,
  Receipt
};