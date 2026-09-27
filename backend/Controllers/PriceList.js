// controllers/priceListController.js

import PriceList from "../Models/PriceList.js"
import Zone from "../Models/Zone.js";
import TransitWay from "../Models/TransitWay.js";
import { Sequelize } from "sequelize";

/**
 * Create Price List
 */
export const createPriceList = async (req, res) => {
  try {
    const { zoneId, range, price, transitId } = req.body;

    if (!zoneId || !price || !range || !transitId) {
      return res.status(400).json({ message: "تمام فیلدها ضروری هستند." });
    }

    const newRecord = await PriceList.create({
      zoneId,
      range,
      price,
      transitId,
    });

    res.status(201).json({
      message: "قیمت‌لیست موفقانه ایجاد شد.",
      data: newRecord,
    });
  } catch (error) {
    console.error("Create PriceList error:", error);
    res.status(500).json({ message: "خطا در ایجاد قیمت‌لیست" });
  }
};

/**
 * Get All Price Lists
 */
export const getAllPriceLists = async (req, res) => {
  try {
    const lists = await PriceList.findAll({
      include: [
        { model: Zone, attributes: ["id", "name"] },
        { model: TransitWay, attributes: ["id", "name"] },
      ],
      order: [["id", "DESC"]],
    });

    res.json(lists);
  } catch (error) {
    console.error("Get All PriceList error:", error);
    res.status(500).json({ message: "خطا در دریافت قیمت‌لیست‌ها" });
  }
};

/**
 * Get Single Price List
 */
export const getPriceList = async (req, res) => {
  try {
    const id = req.params.id;

    const list = await PriceList.findByPk(id, {
      include: [
        { model: Zone, attributes: ["id", "name"] },
        { model: TransitWay, attributes: ["id", "name"] },
      ],
    });

    if (!list) {
      return res.status(404).json({ message: "قیمت‌لیست یافت نشد." });
    }

    res.json(list);
  } catch (error) {
    console.error("Get Single PriceList error:", error);
    res.status(500).json({ message: "خطا در دریافت قیمت‌لیست" });
  }
};

/**
 * Update Price List
 */
export const updatePriceList = async (req, res) => {
  try {
    const id = req.params.id;
    const { zoneId, range, price, transitId } = req.body;

    const list = await PriceList.findByPk(id);
    if (!list) {
      return res.status(404).json({ message: "قیمت‌لیست یافت نشد." });
    }

    await list.update({
      zoneId: zoneId ?? list.zoneId,
      range: range ?? list.range,
      price: price ?? list.price,
      transitId: transitId ?? list.transitId,
    });

    res.json({
      message: "قیمت‌لیست با موفقیت آپدیت شد.",
      data: list,
    });
  } catch (error) {
    console.error("Update PriceList error:", error);
    res.status(500).json({ message: "خطا در آپدیت قیمت‌لیست" });
  }
};

/**
 * Delete Price List
 */
export const deletePriceList = async (req, res) => {
  try {
    const id = req.params.id;

    const list = await PriceList.findByPk(id);
    if (!list) {
      return res.status(404).json({ message: "قیمت‌لیست یافت نشد." });
    }

    await list.destroy();

    res.json({ message: "قیمت‌لیست با موفقیت حذف شد." });
  } catch (error) {
    console.error("Delete PriceList error:", error);
    res.status(500).json({ message: "خطا در حذف قیمت‌لیست" });
  }
};
/**
 * Find Price by Country & Weight
 */
export const findPriceByCountryAndWeight = async (req, res) => {
  try {
    const { country, weight } = req.query;

    if (!country || !weight) {
      return res.status(400).json({ message: "Country و Weight الزامی است." });
    }

    const weightValue = Number(weight);
    const countryLower = country.toLowerCase();

    // ---------------------------------------------
    // 1️⃣ Find ALL zones containing the country
    // ---------------------------------------------
    const zones = await Zone.findAll({
      where: Sequelize.literal(`JSON_CONTAINS(countries, '["${countryLower}"]')`)
    });

    if (!zones || zones.length === 0) {
      return res.status(404).json({ message: "زون مربوطه یافت نشد." });
    }

    const zoneIds = zones.map(z => z.id);

    // ---------------------------------------------
    // 2️⃣ Find ALL price lists for these zone IDs
    // ---------------------------------------------
    const lists = await PriceList.findAll({
      where: { zoneId: zoneIds },
      include: [{ model: TransitWay, attributes: ["id", "name"] }],
      order: [["id", "ASC"]],
    });

    if (!lists || lists.length === 0) {
      return res.status(404).json({ message: "هیچ قیمت‌لیستی برای این زون‌ها یافت نشد." });
    }

    // ---------------------------------------------
    // 3️⃣ Filter by weight range
    // ---------------------------------------------
    const matching = lists.filter(item => {
      if (!item.range || typeof item.range !== "object") return false;

      const min = Number(item.range.start);
      const max = Number(item.range.end);

      return weightValue > min && weightValue <= max;
    });

    if (matching.length === 0) {
      return res.status(404).json({ message: "برای این وزن هیچ قیمت‌لیستی یافت نشد." });
    }

    // ---------------------------------------------
    // 4️⃣ Return all valid prices
    // ---------------------------------------------
    res.json({
      message: "تمام قیمت‌های مطابق یافت شد.",
      data: matching,
    });

  } catch (error) {
    console.error("Find Price error:", error);
    res.status(500).json({ message: "خطا در دریافت قیمت." });
  }
};



