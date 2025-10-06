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

// ✅ 1️⃣ Apply CORS before anything else
app.use(cors({
  origin: [
    "https://estate-ease-1-l3ba.onrender.com",  // deployed frontend
    "http://localhost:5173"                     // local dev
  ],
  credentials: true,
}));

// ✅ Handle preflight requests
app.options('*', cors({
  origin: [
    "https://estate-ease-1-l3ba.onrender.com",
    "http://localhost:5173"
  ],
  credentials: true,
}));

// ✅ 2️⃣ Parse JSON + cookies
app.use(express.json());
app.use(cookieParser());

// ✅ 3️⃣ Define API routes *before* serving static files
app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/listing', listingRouter);

// ✅ 4️⃣ Serve frontend only after API routes
app.use(express.static(path.join(__dirname, 'client', 'dist')));

app.get('/', (req, res) => {
  res.send('Backend working fine!');
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// ✅ 5️⃣ Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

// ✅ 6️⃣ Start server
app.listen(3000, () => console.log('🚀 Server running on port 3000'));
