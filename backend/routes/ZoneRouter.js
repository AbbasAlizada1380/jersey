import express from "express";
import {
  createZone,
  getAllZones,
  getZoneById,
  updateZone,
  deleteZone,
  getAllCountries,
  getAllPricesByCountryAndWeight,
} from "../Controllers/zoneController.js";

const ZoneRouter = express.Router();

ZoneRouter.post("/", createZone);
ZoneRouter.get("/countries", getAllCountries);
ZoneRouter.get("/priceList", getAllPricesByCountryAndWeight);
ZoneRouter.get("/", getAllZones);
ZoneRouter.get("/:id", getZoneById);
ZoneRouter.patch("/:id", updateZone);
ZoneRouter.delete("/:id", deleteZone);

export default ZoneRouter;
