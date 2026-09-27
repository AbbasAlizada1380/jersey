// Controllers/zoneController.js
import Zone from "../Models/Zone.js";
import PriceList from "../Models/PriceList.js";
import sequelize from "../dbconnection.js";

export const getAllPricesByCountryAndWeight = async (req, res) => {
  try {
    const { country, weight } = req.body;

    if (!country || !weight) {
      return res.status(400).json({
        message: "country and weight are required",
      });
    }

    // 1️⃣ Find zone that contains this country
    const zone = await Zone.findOne({
      where: sequelize.where(
        sequelize.fn(
          "JSON_CONTAINS",
          sequelize.col("countries"),
          JSON.stringify(country)
        ),
        1
      ),
    });

    if (!zone) {
      return res.status(404).json({
        message: `No zone found for country: ${country}`,
      });
    }

    const zoneId = zone.id;

    // 2️⃣ Find ALL matching price list records for weight range
    const allPriceLists = await PriceList.findAll({
      where: { zoneId },
      raw: true,
    });

    // Filter them manually because "range" is JSON (JS filtering required)
    const matchingRanges = allPriceLists.filter((item) => {
      const { start, end } = item.range;
      return weight >= start && weight <= end;
    });

    if (matchingRanges.length === 0) {
      return res.status(404).json({
        message: `No price range found for weight ${weight}`,
      });
    }

    res.status(200).json({
      message: "Matching price lists found",
      zoneId,
      country,
      weight,
      results: matchingRanges,
    });
  } catch (error) {
    console.error("Error fetching price lists:", error);
    res.status(500).json({ message: error.message });
  }
};

export const createZone = async (req, res) => {
  try {
    const zone = await Zone.create(req.body);
    res.status(201).json(zone);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllZones = async (req, res) => {
  try {
    const zones = await Zone.findAll();
    res.json(zones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getZoneById = async (req, res) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ message: "Zone not found" });
    res.json(zone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateZone = async (req, res) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ message: "Zone not found" });

    await zone.update(req.body);
    res.json(zone);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteZone = async (req, res) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    if (!zone) return res.status(404).json({ message: "Zone not found" });

    await zone.destroy();
    res.json({ message: "Zone deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllCountries = async (req, res) => {
  try {
    const zones = await Zone.findAll({
      attributes: ["countries"], // no DISTINCT needed since we will merge manually
      raw: true,
    });

    // Merge all arrays into one
    let mergedCountries = [];

    zones.forEach((item) => {
      if (Array.isArray(item.countries)) {
        mergedCountries = [...mergedCountries, ...item.countries];
      }
    });

    // Remove duplicates
    const uniqueCountries = [...new Set(mergedCountries)];

    res.status(200).json({ countries: uniqueCountries });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

