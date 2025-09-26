import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
  {
    visitor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visitor",
      required: true,
    },
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    }, // always derived from host

    purpose: { type: String, required: true },
    appointmentDate: { type: Date, required: true },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "waiting",
        "in-session",
        "completed",
        "checked-in",
        "checked-out",
      ],
      default: "pending",
    },

    actionBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Visit", visitSchema);
