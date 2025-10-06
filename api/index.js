import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRouter from "./routes/user.route.js";
import authRouter from "./routes/auth.route.js";
import listingRouter from "./routes/listing.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

dotenv.config();

mongoose
  .connect("mongodb+srv://sabari:sabari@sabari.tggjoub.mongodb.net/?retryWrites=true&w=majority&appName=sabari")
  .then(() => console.log("✅ Connected to MongoDB!"))
  .catch((err) => console.log(err));

const __dirname = path.resolve();
const app = express();

// ✅ Step 1: define allowed origins
const allowedOrigins = [
  "https://estate-ease-1-l3ba.onrender.com",
  "http://localhost:5173",
];

// ✅ Step 2: plug in cors() globally
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ✅ Step 3: respond immediately to OPTIONS preflight requests
app.options("*", cors({
  origin: allowedOrigins,
  credentials: true,
}));

// ✅ Step 4: other middlewares
app.use(express.json());
app.use(cookieParser());

// ✅ Step 5: API routes (these must come before static serving)
app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/listing", listingRouter);

// ✅ Step 6: serve your frontend
app.use(express.static(path.join(__dirname, "client", "dist")));

app.get("/", (req, res) => {
  res.send("Backend working fine!");
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

// ✅ Step 7: error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

// ✅ Step 8: start server
app.listen(3000, () => console.log("🚀 Server running on port 3000"));
