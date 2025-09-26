import Department from "../models/Department.js";
import User from "../models/User.js";

// -------------------- Create Department (Admin only) --------------------
export const createDepartment = async (req, res) => {
  try {
    if (!req.session?.user || req.session.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can create departments" });
    }

    const { name, description } = req.body;

    const exists = await Department.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: "Department already exists" });
    }

    const department = await Department.create({ name, description });

    res.status(201).json({
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating department", error: error.message });
  }
};

// -------------------- Get all Departments --------------------
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching departments", error: error.message });
  }
};

// -------------------- Get Hosts by Department --------------------
export const getHostsByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const hosts = await User.find({
      role: "host",
      department: departmentId,
    })
      .select("name email department")
      .sort({ name: 1 });

    res.json(hosts);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching hosts by department",
      error: error.message,
    });
  }
};
