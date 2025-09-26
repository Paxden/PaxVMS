import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import connectDB from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import visitorRoutes from "./routes/visitorRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";

dotenv.config();
const app = express();

// -------------------- Middleware --------------------
app.use(
  cors({
    origin: "http://localhost:5173", // ✅ your frontend origin
    credentials: true, // ✅ allow cookies (session)
  })
);
app.use(express.json()); // parse JSON bodies

// ✅ Request logger
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[REQ] ${req.method} ${req.originalUrl} - body:`, req.body);

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[RES] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`
    );
  });

  next();
});

// ✅ Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret", // use env var in prod
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI || "mongodb://localhost:27017/vms",
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true, // protects against XSS
      secure: process.env.NODE_ENV === "production", // true if HTTPS
      maxAge: 1000 * 60 * 60 * 2, // 2 hours
    },
  })
);

// -------------------- Database --------------------
connectDB();

// -------------------- Routes --------------------
app.use("/api/users", userRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/departments", departmentRoutes);

// Root check
app.get("/", (req, res) => {
  res.send("Visitor Management System API is running...");
});

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
