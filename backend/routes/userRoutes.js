import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  deleteUser,
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../controllers/userController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// -------------------- Auth --------------------
router.post("/login", loginUser);
router.post("/logout", requireAuth, logoutUser);
router.get("/me", requireAuth, getCurrentUser);

// -------------------- User CRUD --------------------
router.post("/", createUser); // Public (admin creates first user)
router.get("/", requireAuth, getUsers); // Protected
router.get("/:id", requireAuth, getUserById); // Protected
router.delete("/:id", requireAuth, deleteUser); // Protected

export default router;
