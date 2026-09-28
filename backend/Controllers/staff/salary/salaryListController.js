// controllers/salaryList.controller.js
import { SalaryList, Attendance, Staff } from "../../../Models/index.js";

export const createSalaryList = async (req, res) => {
  const transaction = await SalaryList.sequelize.transaction();

  try {
    const { name, range, total, paid } = req.body;

    if (!name || !range) {
      await transaction.rollback();
      return res.status(400).json({ error: "نام و بازه الزامی است" });
    }

    // 1. Fetch active staff first (we need their ids for staffIds)
    const activeStaff = await Staff.findAll({
      where: { isActive: true },
      attributes: ["id"],
      transaction,
    });

    const staffIds = activeStaff.map((s) => s.id);

    // 2. Create SalaryList with the array of staff ids
    const salaryList = await SalaryList.create(
      {
        name,
        range,
        staffIds,                    // ✅ array stored here
        total: total ?? 0,
        paid: paid ?? 0,
      },
      { transaction }
    );

    // 3. Create one Attendance row per active staff
    if (staffIds.length > 0) {
      const rows = activeStaff.map((s) => ({
        list: salaryList.id,
        staffId: s.id,
        attendance: {
          Saturday:  { attendance: false, overtime: 0 },
          Sunday:    { attendance: false, overtime: 0 },
          Monday:    { attendance: false, overtime: 0 },
          Tuesday:   { attendance: false, overtime: 0 },
          Wednesday: { attendance: false, overtime: 0 },
          Thursday:  { attendance: false, overtime: 0 },
        },
        salary: 0,
        overtime: 0,
        total: 0,
        calculated: false,
      }));

      await Attendance.bulkCreate(rows, { transaction });
    }

    await transaction.commit();

    return res.status(201).json({
      message: "لیست معاش با رکوردهای حاضری ایجاد شد.",
      salaryList,
      attendanceCreated: staffIds.length,
      staffIds,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("createSalaryList error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* READ ALL */
export const getAllSalaryLists = async (req, res) => {
  try {
    const lists = await SalaryList.findAll({ order: [["id", "DESC"]] });
    return res.json(lists);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* READ ONE */
export const getSalaryListById = async (req, res) => {
  try {
    const list = await SalaryList.findByPk(req.params.id, {
      include: [{ model: Attendance, include: [Staff] }],
    });
    if (!list) return res.status(404).json({ message: "Not found" });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* UPDATE */
export const updateSalaryList = async (req, res) => {
  try {
    const list = await SalaryList.findByPk(req.params.id);
    if (!list) return res.status(404).json({ message: "Not found" });
    await list.update(req.body);
    return res.json({ message: "Updated", list });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/* DELETE */
export const deleteSalaryList = async (req, res) => {
  const transaction = await SalaryList.sequelize.transaction();
  try {
    const list = await SalaryList.findByPk(req.params.id, { transaction });
    if (!list) {
      await transaction.rollback();
      return res.status(404).json({ message: "Not found" });
    }

    // Delete linked attendance first (because onDelete is RESTRICT by default)
    await Attendance.destroy({ where: { list: list.id }, transaction });
    await list.destroy({ transaction });

    await transaction.commit();
    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    await transaction.rollback();
    return res.status(500).json({ error: err.message });
  }
};