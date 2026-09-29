import { Bill, Order, Customer } from "../../Models/index.js";
import { Op } from "sequelize";

/* ===========================
   Create Bill
   - optionally accepts `orders: [...]` to create orders in one shot
=========================== */
export const createBill = async (req, res) => {
  const transaction = await Bill.sequelize.transaction();
  try {
    const {
      customerType = "temporary",
      customer = null,
      name,
      phoneNumber = null,
      total = 0,
      receipt = [],
      orders = [],
    } = req.body;

    if (!name) {
      await transaction.rollback();
      return res.status(400).json({ message: "نام مشتری الزامی است" });
    }

    if (!["permanent", "temporary"].includes(customerType)) {
      await transaction.rollback();
      return res.status(400).json({ message: "نوع مشتری نامعتبر است" });
    }

    if (customerType === "permanent" && !customer) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: "مشتری دائم باید به یک مشتری متصل باشد" });
    }

    // Create the bill (beforeSave hook computes remaind + status)
    const bill = await Bill.create(
      {
        customerType,
        customer: customerType === "permanent" ? customer : null,
        name,
        phoneNumber,
        total,
        receipt,
      },
      { transaction }
    );

    // Create linked orders (if any)
    if (Array.isArray(orders) && orders.length > 0) {
      const orderRows = orders.map((o) => ({
        ...o,
        billNumber: bill.id,
      }));
      await Order.bulkCreate(orderRows, { transaction });
    }

    // Recompute total from orders if orders were supplied
    if (orders.length > 0) {
      const totalFromOrders = orders.reduce(
        (sum, o) => sum + Number(o.price || 0) * Number(o.quantity || 0),
        0
      );
      await bill.update({ total: totalFromOrders }, { transaction });
    }

    await transaction.commit();

    const full = await Bill.findByPk(bill.id, {
      include: [{ model: Order, as: "orders" }],
    });

    res.status(201).json({
      success: true,
      message: "بل با موفقیت ثبت شد",
      bill: full,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("createBill error:", error);
    res.status(500).json({
      success: false,
      message: "خطا در ثبت بل",
      error: error.message,
    });
  }
};

/* ===========================
   Get Bills (paginated)
   Query params: page, limit, customerType, status
=========================== */
export const getBills = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.customerType)
      where.customerType = req.query.customerType;
    if (req.query.status) where.status = req.query.status;
    if (req.query.customer) where.customer = req.query.customer;

    const { count, rows } = await Bill.findAndCountAll({
      where,
      limit,
      offset,
      order: [["id", "DESC"]],
      include: [
        {
          model: Customer,
          as: "customerInfo",
          attributes: ["id", "fullname", "phoneNumber"],
        },
      ],
    });

    res.json({
      bills: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error("getBills error:", error);
    res.status(500).json({
      message: "خطا در دریافت بل‌ها",
      error: error.message,
    });
  }
};

/* ===========================
   Get Bill by ID (with orders + customer)
=========================== */
export const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findByPk(req.params.id, {
      include: [
        {
          model: Order,
          as: "orders",
          order: [["id", "ASC"]],
        },
        {
          model: Customer,
          as: "customerInfo",
        },
      ],
    });

    if (!bill) {
      return res.status(404).json({ message: "بل یافت نشد" });
    }

    res.json(bill);
  } catch (error) {
    console.error("getBillById error:", error);
    res.status(500).json({
      message: "خطا در دریافت بل",
      error: error.message,
    });
  }
};

/* ===========================
   Update Bill (full)
=========================== */
export const updateBill = async (req, res) => {
  try {
    const bill = await Bill.findByPk(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: "بل یافت نشد" });
    }

    const allowed = [
      "customerType",
      "customer",
      "name",
      "phoneNumber",
      "total",
      "receipt",
    ];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    await bill.update(updates); // beforeSave recomputes remaind + status

    res.json({
      success: true,
      message: "بل با موفقیت به‌روزرسانی شد",
      bill,
    });
  } catch (error) {
    console.error("updateBill error:", error);
    res.status(500).json({
      message: "خطا در به‌روزرسانی بل",
      error: error.message,
    });
  }
};

/* ===========================
   Update Bill (partial)
=========================== */
export const updateBillProperties = async (req, res) => {
  try {
    const bill = await Bill.findByPk(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: "بل یافت نشد" });
    }

    const allowed = [
      "customerType",
      "customer",
      "name",
      "phoneNumber",
      "total",
      "receipt",
    ];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    await bill.update(updates);

    res.json({
      success: true,
      message: "بل با موفقیت به‌روزرسانی شد",
      bill,
    });
  } catch (error) {
    console.error("updateBillProperties error:", error);
    res.status(500).json({
      message: "خطا در به‌روزرسانی بل",
      error: error.message,
    });
  }
};

/* ===========================
   Add payment to a bill
=========================== */
export const addPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "مبلغ نامعتبر است" });
    }

    const bill = await Bill.findByPk(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: "بل یافت نشد" });
    }

    const current = Array.isArray(bill.receipt) ? bill.receipt : [];
    const next = [...current, Number(amount)];

    await bill.update({ receipt: next }); // hook recomputes remaind + status

    res.json({
      success: true,
      message: "پرداخت ثبت شد",
      bill,
    });
  } catch (error) {
    console.error("addPayment error:", error);
    res.status(500).json({
      message: "خطا در ثبت پرداخت",
      error: error.message,
    });
  }
};

/* ===========================
   Delete Bill (cascades orders -> SET NULL)
=========================== */
export const deleteBill = async (req, res) => {
  const transaction = await Bill.sequelize.transaction();
  try {
    const bill = await Bill.findByPk(req.params.id, { transaction });
    if (!bill) {
      await transaction.rollback();
      return res.status(404).json({ message: "بل یافت نشد" });
    }

    // Explicitly detach orders first so we don't rely on the FK action alone
    await Order.update(
      { billNumber: null },
      { where: { billNumber: bill.id }, transaction }
    );

    await bill.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: "بل با موفقیت حذف شد",
      deletedId: bill.id,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("deleteBill error:", error);
    res.status(500).json({
      message: "خطا در حذف بل",
      error: error.message,
    });
  }
};

/* ===========================
   Search Bills (name / phone)
=========================== */
export const searchBills = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ message: "عبارت جستجو الزامی است" });
    }

    const search = q.trim();

    const bills = await Bill.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { phoneNumber: { [Op.like]: `%${search}%` } },
        ],
      },
      order: [["createdAt", "DESC"]],
      include: [{ model: Order, as: "orders" }],
    });

    if (!bills.length) {
      return res.status(404).json({ message: "هیچ نتیجه‌ای یافت نشد" });
    }

    res.json(bills);
  } catch (error) {
    console.error("searchBills error:", error);
    res.status(500).json({
      message: "خطا در جستجو",
      error: error.message,
    });
  }
};