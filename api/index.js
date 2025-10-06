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

  const app = express();

  app.use(cors({
    origin: [
      "https://estate-ease-1-l3ba.onrender.com",
      "http://localhost:5173"
    ],
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());
  
  app.use('/api/user', userRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/listing', listingRouter);
  
  const __dirname = path.resolve();
  app.use(express.static(path.join(__dirname, '/client/dist')));
  
  app.get('/', (req, res) => {
    res.send('Backend working fine!');
  });
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
  });

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
