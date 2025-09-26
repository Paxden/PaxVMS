import express from "express";
import upload from "../middleware/upload.js";
import {
  registerVisitor,
  confirmVisitor,
  checkOutVisitor,
  getVisitors,
  getVisitorById,
  checkInVisitor,
  updateVisitorStatus,
  getVisits,
  addVisit,
} from "../controllers/visitorController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// Visit logs
router.get("/visits", getVisits);

// Security
router.post("/register", upload.single("photo"), registerVisitor);
router.post("/:id/visits", addVisit);

// Receptionist
router.post("/:id/visits/:visitId/confirm", confirmVisitor);

// Common
router.get("/", getVisitors);
router.get("/:id", getVisitorById);

// Checks
// Check-in / Check-out (Security)
router.put("/:id/visits/:visitId/checkin", checkInVisitor);
router.put("/:id/visits/:visitId/checkout", checkOutVisitor);

// Update visitor status (receptionist/host action)
// PATCH /api/visitors/:id/visits/:visitId/status

router.patch(
  "/:id/visits/:visitId/status",
  requireAuth, // 🔑 make sure the user is logged in
  updateVisitorStatus // your controller
);

export default router;
