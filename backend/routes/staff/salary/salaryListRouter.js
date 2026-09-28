// routes/salaryList.routes.js
import express from "express";
import {
  createSalaryList,
  getAllSalaryLists,
  getSalaryListById,
  updateSalaryList,
  deleteSalaryList,
} from "../../../Controllers/staff/salary/salaryListController.js";

const salaryRoute = express.Router();
salaryRoute.post("/", createSalaryList);
salaryRoute.get("/", getAllSalaryLists);
salaryRoute.get("/:id", getSalaryListById);
salaryRoute.put("/:id", updateSalaryList);
salaryRoute.delete("/:id", deleteSalaryList);
export default salaryRoute;