import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    photoUrl: String,
  },
  { timestamps: true }
);

export default mongoose.model("Visitor", visitorSchema);
