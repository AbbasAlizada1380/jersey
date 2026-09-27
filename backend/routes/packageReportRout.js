// routes/packageStats.js
import express from "express";
import {
  getPackageStatistics,
  getPackageStatisticsSequelize,
  getDetailedPackageStatistics,
  getPackageStatisticsByLocation,
  getTopPackagesReport,
} from "../Controllers/packageStatesController.js";

const PackageReportRouter = express.Router();

// GET /api/package-stats - Basic package statistics (manual calculation)
PackageReportRouter.get("/", getPackageStatistics);

// GET /api/package-stats/sequelize - Package statistics using Sequelize aggregates
PackageReportRouter.get("/sequelize", getPackageStatisticsSequelize);

// GET /api/package-stats/detailed - Detailed package statistics with breakdowns
PackageReportRouter.get("/detailed", getDetailedPackageStatistics);

// GET /api/package-stats/location - Package statistics grouped by location
PackageReportRouter.get("/location", getPackageStatisticsByLocation);

// GET /api/package-stats/top - Top packages by value and weight
PackageReportRouter.get("/top", getTopPackagesReport);

export default PackageReportRouter;
