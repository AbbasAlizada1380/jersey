import express from "express";
import {
  createTransit,
  getAllTransits,
  getTransitById,
  updateTransit,
  deleteTransit,
} from "../Controllers/TranistWayController.js"

const TransitWayRouter = express.Router();

TransitWayRouter.post("/", createTransit);
TransitWayRouter.get("/", getAllTransits);
TransitWayRouter.get("/:id", getTransitById);
TransitWayRouter.patch("/:id", updateTransit);
TransitWayRouter.delete("/:id", deleteTransit);

export default TransitWayRouter;
