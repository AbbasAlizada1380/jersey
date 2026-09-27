import Package from "../Models/package.js";
import { Op, fn, col, literal } from "sequelize";


export const getPackageStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const whereCondition = {};

    if (startDate && endDate) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereCondition.createdAt = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      whereCondition.createdAt = { [Op.lte]: new Date(endDate) };
    }

    const packages = await Package.findAll({
      where: whereCondition,
      attributes: [
        "id",
        "totalWeight",
        "piece",
        "perKgCash",
        "OPerKgCash",
        "OTotalCash",
        "totalCash",
        "remain",
        "received",
        "transitWay",
        "location",       // ✅ IMPORTANT
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
    });

    const statistics = {
      totalPackagesCount: packages.length,
      totalIncome: 0,
      totalReceivedMoney: 0,
      totalPendingMoney: 0,
      totalWeight: 0,
      totalPieces: 0,
      totalOfficeIncome: 0,
      averageWeight: 0,
      averageTotalCash: 0,

      // ✅ NEW
      locationStatistics: {},
      locations: [],

      timeRange: {
        startDate: startDate || null,
        endDate: endDate || null,
        hasTimeRange: !!(startDate || endDate),
      },
    };

    packages.forEach((pkg) => {
      const totalCash = parseFloat(pkg.totalCash) || 0;
      const received = parseFloat(pkg.received) || 0;
      const remain = parseFloat(pkg.remain) || 0;
      const totalWeight = parseFloat(pkg.totalWeight) || 0;
      const piece = parseInt(pkg.piece) || 0;
      const OTotalCash = parseFloat(pkg.OTotalCash) || 0;
      const location = pkg.location || "Unknown";

      statistics.totalIncome += totalCash;
      statistics.totalReceivedMoney += received;
      statistics.totalPendingMoney += remain;
      statistics.totalWeight += totalWeight;
      statistics.totalPieces += piece;
      statistics.totalOfficeIncome += OTotalCash;

      // 📍 LOCATION COUNT
      statistics.locationStatistics[location] =
        (statistics.locationStatistics[location] || 0) + 1;
    });

    // Calculate averages
    if (packages.length > 0) {
      statistics.averageWeight = statistics.totalWeight / packages.length;
      statistics.averageTotalCash = statistics.totalIncome / packages.length;
    }

    // Calculate percentages
    if (statistics.totalIncome > 0) {
      statistics.receivedPercentage =
        (statistics.totalReceivedMoney / statistics.totalIncome) * 100;

      statistics.pendingPercentage =
        (statistics.totalPendingMoney / statistics.totalIncome) * 100;

      statistics.profitPercentage =
        ((statistics.totalIncome - statistics.totalOfficeIncome) /
          statistics.totalIncome) *
        100;
    }

    // Convert location object → array (frontend-friendly)
    statistics.locations = Object.entries(
      statistics.locationStatistics
    ).map(([location, count]) => ({
      location,
      count,
    }));

    res.status(200).json({
      success: true,
      data: statistics,
      message: "آمار بسته‌ها با موفقیت دریافت شد",
    });
  } catch (error) {
    console.error("Error in getPackageStatistics:", error);
    res.status(500).json({
      success: false,
      message: "خطا در دریافت آمار بسته‌ها",
      error: error.message,
    });
  }
};


/**
 * Package Statistics using Sequelize aggregate functions
 */
export const getPackageStatisticsSequelize = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const whereCondition = {};

    if (startDate && endDate) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereCondition.createdAt = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      whereCondition.createdAt = { [Op.lte]: new Date(endDate) };
    }

    const stats = await Package.findAll({
      where: whereCondition,
      attributes: [
        [fn("COUNT", col("id")), "totalPackagesCount"],
        [fn("SUM", col("totalCash")), "totalIncome"],
        [fn("SUM", col("recip")), "totalReceivedMoney"],
        [fn("SUM", col("remain")), "totalPendingMoney"],
        [fn("SUM", col("goodWeight")), "totalWeight"],
        [fn("SUM", col("piece")), "totalPieces"],
        [fn("AVG", col("goodWeight")), "averageWeight"],
        [fn("AVG", col("totalCash")), "averageTotalCash"],
        [fn("AVG", col("perKgCash")), "averagePerKgCash"],
      ],
      raw: true,
    });

    const result = stats[0] || {};

    res.status(200).json({
      success: true,
      data: {
        totalPackagesCount: parseInt(result.totalPackagesCount) || 0,
        totalIncome: parseFloat(result.totalIncome) || 0,
        totalReceivedMoney: parseFloat(result.totalReceivedMoney) || 0,
        totalPendingMoney: parseFloat(result.totalPendingMoney) || 0,
        totalWeight: parseFloat(result.totalWeight) || 0,
        totalPieces: parseInt(result.totalPieces) || 0,
        averageWeight: parseFloat(result.averageWeight) || 0,
        averageTotalCash: parseFloat(result.averageTotalCash) || 0,
        averagePerKgCash: parseFloat(result.averagePerKgCash) || 0,
        timeRange: {
          startDate: startDate || null,
          endDate: endDate || null,
          hasTimeRange: !!(startDate || endDate),
        },
      },
    });
  } catch (error) {
    console.error("Error in getPackageStatisticsSequelize:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching package statistics",
      error: error.message,
    });
  }
};

/**
 * Detailed Package Statistics with breakdowns
 */
export const getDetailedPackageStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const whereCondition = {};

    if (startDate && endDate) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    // Overall stats
    const overallStats = await Package.findAll({
      where: whereCondition,
      attributes: [
        [fn("SUM", col("totalCash")), "totalIncome"],
        [fn("SUM", col("recip")), "totalReceivedMoney"],
        [fn("SUM", col("remain")), "totalPendingMoney"],
        [fn("SUM", col("goodWeight")), "totalWeight"],
        [fn("SUM", col("piece")), "totalPieces"],
        [fn("COUNT", col("id")), "totalPackagesCount"],
        [fn("AVG", col("totalCash")), "averageTotalCash"],
        [fn("AVG", col("goodWeight")), "averageWeight"],
        [fn("AVG", col("perKgCash")), "averagePerKgCash"],
        [fn("MAX", col("totalCash")), "maxTotalCash"],
        [fn("MIN", col("totalCash")), "minTotalCash"],
        [fn("MAX", col("goodWeight")), "maxWeight"],
        [fn("MIN", col("goodWeight")), "minWeight"],
      ],
      raw: true,
    });

    // Statistics by country
    const byCountry = await Package.findAll({
      where: whereCondition,
      attributes: [
        "country",
        [fn("COUNT", col("id")), "packageCount"],
        [fn("SUM", col("totalCash")), "totalIncome"],
        [fn("SUM", col("recip")), "receivedMoney"],
        [fn("SUM", col("remain")), "pendingMoney"],
        [fn("SUM", col("goodWeight")), "totalWeight"],
        [fn("AVG", col("totalCash")), "averageValue"],
      ],
      group: ["country"],
      having: { country: { [Op.not]: null } },
      order: [[fn("SUM", col("totalCash")), "DESC"]],
      raw: true,
    });

    // Statistics by goods type (using goodsDetails)
    const byGoodsType = await Package.findAll({
      where: whereCondition,
      attributes: [
        "goodsDetails",
        [fn("COUNT", col("id")), "packageCount"],
        [fn("SUM", col("totalCash")), "totalIncome"],
        [fn("SUM", col("goodWeight")), "totalWeight"],
        [fn("AVG", col("perKgCash")), "averagePerKgPrice"],
      ],
      group: ["goodsDetails"],
      having: { goodsDetails: { [Op.not]: null } },
      order: [[fn("SUM", col("totalCash")), "DESC"]],
      limit: 10, // Top 10 goods types
      raw: true,
    });

    // Monthly breakdown
    let monthlyBreakdown = [];
    if (startDate && endDate) {
      monthlyBreakdown = await Package.findAll({
        where: whereCondition,
        attributes: [
          [fn("YEAR", col("createdAt")), "year"],
          [fn("MONTH", col("createdAt")), "month"],
          [fn("SUM", col("totalCash")), "totalIncome"],
          [fn("SUM", col("recip")), "receivedMoney"],
          [fn("SUM", col("remain")), "pendingMoney"],
          [fn("SUM", col("goodWeight")), "totalWeight"],
          [fn("COUNT", col("id")), "packageCount"],
        ],
        group: ["year", "month"],
        order: [
          [fn("YEAR", col("createdAt")), "ASC"],
          [fn("MONTH", col("createdAt")), "ASC"],
        ],
        raw: true,
      });
    }

    // Weight distribution statistics
    const weightDistribution = await Package.findAll({
      where: whereCondition,
      attributes: [
        [
          literal(`SUM(CASE WHEN goodWeight <= 1 THEN 1 ELSE 0 END)`),
          "under1kg",
        ],
        [
          literal(
            `SUM(CASE WHEN goodWeight > 1 AND goodWeight <= 5 THEN 1 ELSE 0 END)`
          ),
          "1to5kg",
        ],
        [
          literal(
            `SUM(CASE WHEN goodWeight > 5 AND goodWeight <= 10 THEN 1 ELSE 0 END)`
          ),
          "5to10kg",
        ],
        [
          literal(
            `SUM(CASE WHEN goodWeight > 10 AND goodWeight <= 20 THEN 1 ELSE 0 END)`
          ),
          "10to20kg",
        ],
        [
          literal(`SUM(CASE WHEN goodWeight > 20 THEN 1 ELSE 0 END)`),
          "over20kg",
        ],
      ],
      raw: true,
    });

    const result = overallStats[0] || {};

    res.status(200).json({
      success: true,
      data: {
        // Overall statistics
        totalIncome: parseFloat(result.totalIncome) || 0,
        totalReceivedMoney: parseFloat(result.totalReceivedMoney) || 0,
        totalPendingMoney: parseFloat(result.totalPendingMoney) || 0,
        totalWeight: parseFloat(result.totalWeight) || 0,
        totalPieces: parseInt(result.totalPieces) || 0,
        totalPackagesCount: parseInt(result.totalPackagesCount) || 0,
        averageTotalCash: parseFloat(result.averageTotalCash) || 0,
        averageWeight: parseFloat(result.averageWeight) || 0,
        averagePerKgCash: parseFloat(result.averagePerKgCash) || 0,
        maxTotalCash: parseFloat(result.maxTotalCash) || 0,
        minTotalCash: parseFloat(result.minTotalCash) || 0,
        maxWeight: parseFloat(result.maxWeight) || 0,
        minWeight: parseFloat(result.minWeight) || 0,

        // Breakdowns
        byCountry,
        byGoodsType,
        monthlyBreakdown,
        weightDistribution: weightDistribution[0] || {},

        // Time range info
        timeRange: {
          startDate: startDate || null,
          endDate: endDate || null,
          hasTimeRange: !!(startDate || endDate),
        },
      },
    });
  } catch (error) {
    console.error("Error in getDetailedPackageStatistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching detailed package statistics",
      error: error.message,
    });
  }
};

/**
 * Additional: Package Statistics by Location
 */
export const getPackageStatisticsByLocation = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const whereCondition = {};

    if (startDate && endDate) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const statsByLocation = await Package.findAll({
      where: whereCondition,
      attributes: [
        "location",
        [fn("COUNT", col("id")), "packageCount"],
        [fn("SUM", col("totalCash")), "totalIncome"],
        [fn("SUM", col("recip")), "receivedMoney"],
        [fn("SUM", col("remain")), "pendingMoney"],
        [fn("SUM", col("goodWeight")), "totalWeight"],
        [fn("AVG", col("totalCash")), "averageValue"],
        [fn("AVG", col("goodWeight")), "averageWeight"],
      ],
      group: ["location"],
      having: { location: { [Op.not]: null } },
      order: [[fn("SUM", col("totalCash")), "DESC"]],
      raw: true,
    });

    res.status(200).json({
      success: true,
      data: {
        byLocation: statsByLocation,
        timeRange: {
          startDate: startDate || null,
          endDate: endDate || null,
          hasTimeRange: !!(startDate || endDate),
        },
      },
    });
  } catch (error) {
    console.error("Error in getPackageStatisticsByLocation:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching package statistics by location",
      error: error.message,
    });
  }
};

/**
 * Additional: Top Packages Report
 */
export const getTopPackagesReport = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    const whereCondition = {};

    if (startDate && endDate) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const topPackagesByValue = await Package.findAll({
      where: whereCondition,
      attributes: [
        "id",
        "senderName",
        "receiverName",
        "country",
        "goodsDetails",
        "goodWeight",
        "totalCash",
        "recip",
        "remain",
        "createdAt",
      ],
      order: [["totalCash", "DESC"]],
      limit: parseInt(limit),
      raw: true,
    });

    const topPackagesByWeight = await Package.findAll({
      where: whereCondition,
      attributes: [
        "id",
        "senderName",
        "receiverName",
        "country",
        "goodsDetails",
        "goodWeight",
        "totalCash",
        "recip",
        "remain",
        "createdAt",
      ],
      order: [["goodWeight", "DESC"]],
      limit: parseInt(limit),
      raw: true,
    });

    res.status(200).json({
      success: true,
      data: {
        topByValue: topPackagesByValue,
        topByWeight: topPackagesByWeight,
        timeRange: {
          startDate: startDate || null,
          endDate: endDate || null,
          hasTimeRange: !!(startDate || endDate),
        },
      },
    });
  } catch (error) {
    console.error("Error in getTopPackagesReport:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching top packages report",
      error: error.message,
    });
  }
};
