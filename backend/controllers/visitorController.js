import Visitor from "../models/Visitor.js";
import User from "../models/User.js";
import { sendMail } from "../utilis/mailer.js";
import Visit from "../models/Visit.js";

// Register Visitor (Security)
export const registerVisitor = async (req, res) => {
  try {
    const { name, email, phone, purpose, host, appointmentDate } = req.body;
    const photoUrl = req.file?.path;

    // 1️⃣ Check if visitor already exists (by email or phone)
    let visitor = await Visitor.findOne({ $or: [{ email }, { phone }] });

    if (!visitor) {
      visitor = new Visitor({
        name,
        email,
        phone,
        photoUrl,
      });
      await visitor.save();
    }

    // 2️⃣ Get host info (to derive department)
    const hostUser = await User.findById(host).populate("department");
    if (!hostUser) {
      return res.status(400).json({ message: "Host not found" });
    }

    // 3️⃣ Create Visit record
    const visit = await Visit.create({
      visitor: visitor._id,
      host: hostUser._id,
      department: hostUser.department,
      purpose,
      appointmentDate,
      status: "pending",
      actionBy: req.user?._id || null,
    });

    // 4️⃣ Notify host
    if (hostUser.email) {
      await sendMail({
        to: hostUser.email,
        subject: "New Visitor Notification",
        text: `Visitor ${visitor.name} has booked an appointment for ${appointmentDate}.`,
      });
    }

    res.status(201).json({
      message: "Visitor registered and visit created successfully",
      visitor,
      visit,
    });
  } catch (error) {
    console.error("❌ Error registering visitor:", error.message);
    res.status(500).json({ message: "Error registering visitor" });
  }
};

// Confirm Visitor (Receptionist)
export const confirmVisitor = async (req, res) => {
  try {
    const { visitId } = req.params;

    const visit = await Visit.findById(visitId);
    if (!visit) return res.status(404).json({ message: "Visit not found" });

    visit.status = "approved";
    visit.actionBy = req.user?._id || null;

    await visit.save();
    res.json({ message: "Visitor confirmed", visit });
  } catch (error) {
    res.status(500).json({ message: "Error confirming visitor" });
  }
};

// Check-in Visitor
export const checkInVisitor = async (req, res) => {
  try {
    const { visitId } = req.params;

    const visit = await Visit.findById(visitId);
    if (!visit) return res.status(404).json({ message: "Visit not found" });

    if (["waiting", "in-session"].includes(visit.status)) {
      return res.status(400).json({ message: "Visitor already checked in" });
    }

    visit.status = "waiting";
    visit.checkInTime = new Date();
    visit.actionBy = req.user?._id || null;

    await visit.save();
    res.json({ message: "Visitor checked in successfully", visit });
  } catch (error) {
    res.status(500).json({ message: "Error checking in visitor" });
  }
};

// Check-out Visitor
export const checkOutVisitor = async (req, res) => {
  try {
    const { visitId } = req.params;

    const visit = await Visit.findById(visitId);
    if (!visit) return res.status(404).json({ message: "Visit not found" });

    if (!["in-session", "waiting"].includes(visit.status)) {
      return res.status(400).json({ message: "Visitor not currently inside" });
    }

    visit.status = "completed";
    visit.checkOutTime = new Date();
    visit.actionBy = req.user?._id || null;

    await visit.save();
    res.json({ message: "Visitor checked out successfully", visit });
  } catch (error) {
    res.status(500).json({ message: "Error checking out visitor" });
  }
};

// Update Visitor Status (host or receptionist)
export const updateVisitorStatus = async (req, res) => {
  try {
    const { id, visitId } = req.params;
    const { status } = req.body;

    const visit = await Visit.findById(visitId);
    if (!visit) return res.status(404).json({ message: "Visit not found" });

    const userRole = req.session.user?.role;
    const userId = req.session.user?._id;

    // Define allowed status per role
    const allowedStatusByRole = {
      host: ["approved", "rejected", "waiting", "in-session", "completed"],
      receptionist: ["waiting", "in-session", "completed"],
      security: ["waiting", "completed", "checked-in", "checked-out"],
    };

    const allowedStatuses = allowedStatusByRole[userRole] || [];
    if (!allowedStatuses.includes(status)) {
      return res.status(403).json({
        message: `User role '${userRole}' cannot set status '${status}'`,
      });
    }

    // Update visit
    visit.status = status;
    visit.actionBy = userId;
    await visit.save();

    res.json({ message: `Visit status updated to ${status}`, visit });
  } catch (error) {
    console.error("❌ Error updating visit status:", error);
    res.status(500).json({ message: "Error updating visit status" });
  }
};

// Get all Visitors (profiles only)
export const getVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ createdAt: -1 });
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ message: "Error fetching visitors" });
  }
};

// Get one Visitor (with visit history)
export const getVisitorById = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    const visits = await Visit.find({ visitor: visitor._id })
      .populate("host", "name email role")
      .populate("department", "name");

    res.json({ visitor, visits });
  } catch (error) {
    res.status(500).json({ message: "Error fetching visitor" });
  }
};

// Fetch Visits (with filters)
export const getVisits = async (req, res) => {
  try {
    const { status, host, visitor, department } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (host) filter.host = host;
    if (visitor) filter.visitor = visitor;
    if (department) filter.department = department;

    const visits = await Visit.find(filter)
      .populate("visitor", "name email phone photoUrl")
      .populate("host", "name email role")
      .populate("department", "name")
      .populate("actionBy", "name email role")
      .sort({ createdAt: -1 });

    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: "Error fetching visits" });
  }
};

//  Add a new visit for an existing visitor
export const addVisit = async (req, res) => {
  try {
    const { visitorId, host, purpose, appointmentDate } = req.body;

    // 1️⃣ Ensure visitor exists
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    // 2️⃣ Ensure host exists (to derive department)
    const hostUser = await User.findById(host).populate("department");
    if (!hostUser) {
      return res.status(404).json({ message: "Host not found" });
    }

    // 3️⃣ Create the visit
    const visit = await Visit.create({
      visitor: visitor._id,
      host: hostUser._id,
      department: hostUser.department,
      purpose,
      appointmentDate,
      status: "pending",
      actionBy: req.user?._id || null,
    });

    res.status(201).json({
      message: "New visit added successfully",
      visit,
    });
  } catch (error) {
    console.error("❌ Error adding visit:", error.message);
    res.status(500).json({ message: "Error adding visit" });
  }
};
