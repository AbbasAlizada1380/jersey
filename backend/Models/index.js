// models/index.js
import sequelize from "../dbconnection.js";

// Import all models
import Staff from "./staff/staff.js";
import SalaryList from "./staff/salary/salaryList.js";
import Attendance from "./staff/salary/Attendence.js";
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
};

export default {
  sequelize,
  Staff,
  SalaryList,
  Attendance,
};