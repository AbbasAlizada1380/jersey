// controllers/attendance.controller.js
import { Attendance, Staff, SalaryList } from "../../../Models/index.js";

/* ---------------------------------------------------------
   Helper: build the default attendance JSON for a new period
   --------------------------------------------------------- */
const defaultAttendanceJSON = () => ({
  Saturday:  { attendance: false, overtime: 0 },
  Sunday:    { attendance: false, overtime: 0 },
  Monday:    { attendance: false, overtime: 0 },
  Tuesday:   { attendance: false, overtime: 0 },
  Wednesday: { attendance: false, overtime: 0 },
  Thursday:  { attendance: false, overtime: 0 },
});

/* ---------------------------------------------------------
   READ ALL attendance records (optionally filtered by list)
   GET /api/attendance?list=1
   --------------------------------------------------------- */
export const getAllAttendance = async (req, res) => {
  try {
    const where = {};
    if (req.query.list) where.list = req.query.list;
    if (req.query.staffId) where.staffId = req.query.staffId;

    const records = await Attendance.findAll({
      where,
      include: [
        {
          model: Staff,
          as: "staff",                                 // ✅ REQUIRED
          attributes: ["id", "name", "fatherName", "NIC", "salary", "overTimePerHour", "workingDaysPerWeek"],
        },
      ],
      order: [["id", "ASC"]],                          // 👈 asc makes more sense for a list
    });

    // Return as { attendances: [...] } so the frontend can rely on a key
    return res.status(200).json({ attendances: records });
  } catch (error) {
    console.error("getAllAttendance error:", error);
    return res.status(500).json({ error: error.message });
  }
};

/* ---------------------------------------------------------
   READ ONE
   GET /api/attendance/:id
   --------------------------------------------------------- */
export const getAttendanceById = async (req, res) => {
  try {
    const record = await Attendance.findByPk(req.params.id, {
      include: [
        { model: Staff, as: "staff" },                 // ✅ REQUIRED
      ],
    });
    if (!record) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    return res.status(200).json(record);
  } catch (error) {
    console.error("getAttendanceById error:", error);
    return res.status(500).json({ error: error.message });
  }
};

/* ---------------------------------------------------------
   UPDATE attendance (attendance JSON / overtime / recalc total)
   PUT /api/attendance/:id
   body: { attendance: {...}, calculated: true }
   --------------------------------------------------------- */
export const updateAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Attendance record not found" });
    }

    const staff = await Staff.findByPk(record.staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const updates = { ...req.body };

    // If attendance JSON is provided, recalculate salary/overtime/total
    if (updates.attendance) {
      const { salary, overtime, total } = calculatePay(staff, updates.attendance);
      updates.salary = salary;
      updates.overtime = overtime;
      updates.total = total;
      updates.calculated = true;
    }

    await record.update(updates);
    return res.status(200).json({ message: "Updated successfully", record });
  } catch (error) {
    console.error("updateAttendance error:", error);
    return res.status(500).json({ error: error.message });
  }
};

/* ---------------------------------------------------------
   DELETE
   DELETE /api/attendance/:id
   --------------------------------------------------------- */
export const deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    await record.destroy();
    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("deleteAttendance error:", error);
    return res.status(500).json({ error: error.message });
  }
};

/* ---------------------------------------------------------
   PAY CALCULATION HELPER
   --------------------------------------------------------- */
function calculatePay(staff, attendanceJSON) {
  const dailySalary = Number(staff.salary) / Number(staff.workingDaysPerWeek);
  const overtimeRate = Number(staff.overTimePerHour);

  let daysWorked = 0;
  let overtimeHours = 0;

  for (const day of Object.values(attendanceJSON)) {
    if (day?.attendance) daysWorked += 1;
    if (day?.overtime) overtimeHours += Number(day.overtime) || 0;
  }

  const salary = dailySalary * daysWorked;
  const overtime = overtimeRate * overtimeHours;
  const total = salary + overtime;

  return {
    salary: Number(salary.toFixed(2)),
    overtime: Number(overtime.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}