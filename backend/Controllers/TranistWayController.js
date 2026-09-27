// Controllers/transitController.js
import TransitWay from "../Models/TransitWay.js";

export const createTransit = async (req, res) => {
  try {
    const transit = await TransitWay.create(req.body);
    res.status(201).json(transit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllTransits = async (req, res) => {
  try {
    const transits = await TransitWay.findAll();
    res.json(transits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTransitById = async (req, res) => {
  try {
    const transit = await TransitWay.findByPk(req.params.id);
    if (!transit) return res.status(404).json({ message: "Transit not found" });
    res.json(transit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTransit = async (req, res) => {
  try {
    const transit = await TransitWay.findByPk(req.params.id);
    if (!transit) return res.status(404).json({ message: "Transit not found" });

    await transit.update(req.body);
    res.json(transit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTransit = async (req, res) => {
  try {
    const transit = await TransitWay.findByPk(req.params.id);
    if (!transit) return res.status(404).json({ message: "Transit not found" });

    await transit.destroy();
    res.json({ message: "Transit deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
