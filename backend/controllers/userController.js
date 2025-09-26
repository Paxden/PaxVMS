import bcrypt from "bcryptjs";
import User from "../models/User.js";

// -------------------- User Login --------------------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // ✅ Store user in session (without password)
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    };

    res.json({
      message: "Login successful",
      user: req.session.user,
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

// -------------------- User Logout --------------------
export const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Error logging out" });
    res.clearCookie("connect.sid"); // default cookie name from express-session
    res.json({ message: "Logout successful" });
  });
};

// -------------------- Current Logged-in User --------------------
export const getCurrentUser = (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in" });
  }
  res.json(req.session.user);
};

// -------------------- Create User --------------------
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Only one admin allowed
    if (role === "admin") {
      const adminExists = await User.findOne({ role: "admin" });
      if (adminExists) {
        return res
          .status(400)
          .json({ message: "Admin account already exists" });
      }
    }

    // Unique email check
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Host must belong to a department
    if (role === "host" && !department) {
      return res
        .status(400)
        .json({ message: "Host must belong to a department" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      department: role === "host" ? department : null,
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
};

// -------------------- Get All Users --------------------
export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate("department", "name description")
      .select("-password");

    res.json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

// -------------------- Get User by ID --------------------
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("department", "name description")
      .select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
};

// -------------------- Delete User --------------------
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};
