import express from "express";
import {
  createPriceList,
  getAllPriceLists,
  getPriceList,
  updatePriceList,
  deletePriceList,
  findPriceByCountryAndWeight,
} from "../Controllers/PriceList.js";

const PriceListRouter = express.Router();

PriceListRouter.post("/", createPriceList);
PriceListRouter.get("/", getAllPriceLists);
PriceListRouter.get("/lists", findPriceByCountryAndWeight);
PriceListRouter.get("/:id", getPriceList);
PriceListRouter.put("/:id", updatePriceList);
PriceListRouter.delete("/:id", deletePriceList);

export default PriceListRouter;
