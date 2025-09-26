import express from "express";
import {
  createDepartment,
  getDepartments,
  getHostsByDepartment,
} from "../controllers/departmentController.js";

const router = express.Router();

// -------------------- Department Routes --------------------

// Admin only: create department
router.post("/", createDepartment);

// Public: get all departments
router.get("/", getDepartments);

// Public: get hosts under a department
router.get("/:departmentId/hosts", getHostsByDepartment);

export default router;
