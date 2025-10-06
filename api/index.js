import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRouter from './routes/user.route.js';
import authRouter from './routes/auth.route.js';
import listingRouter from './routes/listing.route.js';
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors'; // ✅ import cors

dotenv.config();

// ✅ Connect to MongoDB
mongoose
  .connect("mongodb+srv://sabari:sabari@sabari.tggjoub.mongodb.net/?retryWrites=true&w=majority&appName=sabari")
  .then(() => {
    console.log('Connected to MongoDB!');
  })
  .catch((err) => {
    console.log(err);
  });

const __dirname = path.resolve();
const app = express();

// ✅ Allow frontend access (CORS fix)
app.use(
  cors({
    origin: [
      "http://localhost:5173", // local frontend
      "https://estate-ease-5ytq.vercel.app" // deployed frontend on Vercel
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// ✅ Routes
app.use('/api/user', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/listing', listingRouter);

// ✅ Serve static files (for deployed frontend)
app.use(express.static(path.join(__dirname, '/client/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// ✅ Error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

// ✅ Start server (for local dev)
app.listen(3000, () => {
  console.log('Server is running on port 3000!');
});
