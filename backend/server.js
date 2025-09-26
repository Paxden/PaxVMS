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
const allowedOrigins = [
  "http://localhost:5173", // local dev
  "https://pax-vms.vercel.app", // vercel frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // 🔑 send cookies
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
app.set("trust proxy", 1); // needed for secure cookies on Render

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI || "mongodb://localhost:27017/vms",
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only secure in prod
      sameSite: "none", // 🔑 allow cross-site cookies
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
