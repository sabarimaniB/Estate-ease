import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import listingRouter from './routes/listing.route.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';

dotenv.config();

mongoose
  .connect("mongodb+srv://sabari:sabari@sabari.tggjoub.mongodb.net/?retryWrites=true&w=majority&appName=sabari")
  .then(() => console.log('✅ Connected to MongoDB!'))
  .catch((err) => console.log(err));

const __dirname = path.resolve();
const app = express();

// ✅ CORS configuration for both local & deployed frontends
app.use(
  cors({
    origin: ["https://estate-ease-5ytq.vercel.app"], // your frontend domain
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// ✅ Routes
app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/listing', listingRouter);

// ✅ Serve frontend (for production)
app.use(express.static(path.join(__dirname, '/client/dist')));
app.get("/", (req, res) => {
  res.send("Backend working fine!");
});
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

// ✅ Start server (local only)
app.listen(3000, () => console.log('🚀 Server running on port 3000'));
