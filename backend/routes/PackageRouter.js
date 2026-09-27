// routes/packageRoutes.js
import express from "express";
import {
  createPackage,
  getAllPackages,
  getPackageById,
  updatePackage,
  deletePackage,
  getAllTransitWays,
  getPackagesByRange,
  updatePackageLocation,
  searchPackagesByName,
  updatePackageTracking,
  getPackagesWithRemaining,
  closePackageRemaining,
  getPackagesByRunQuery,
} from "../Controllers/PackageController.js";

const packageRouter = express.Router();

// =======================
// Package Routes
// =======================

// Create package + sender + receiver
packageRouter.post("/track/:id", updatePackageTracking);
packageRouter.post("/updateLocation/:id", updatePackageLocation);
packageRouter.post("/updateRemaining/:id", closePackageRemaining);
packageRouter.post("/", createPackage);

// Get all packages
packageRouter.get("/transitWays", getAllTransitWays);
packageRouter.get("/Range*", getPackagesByRange);
packageRouter.get("/remaining", getPackagesWithRemaining);
packageRouter.get("/search", searchPackagesByName);
packageRouter.get("/run", getPackagesByRunQuery);
packageRouter.get("/", getAllPackages);

// Get package by ID
packageRouter.get("/:id", getPackageById);

// Update package (and optionally sender/receiver)
packageRouter.put("/:id", updatePackage);

// Delete package
packageRouter.delete("/:id", deletePackage);

export default packageRouter;
