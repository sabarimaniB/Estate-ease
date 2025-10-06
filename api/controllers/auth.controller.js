import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../utils/error.js';

// 🟢 SIGN UP
export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = bcryptjs.hashSync(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json('User created successfully!');
  } catch (error) {
    next(error);
  }
};

// 🟢 SIGN IN
export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const validUser = await User.findOne({ email });
    if (!validUser) return next(errorHandler(404, 'User not found!'));

    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) return next(errorHandler(401, 'Wrong credentials!'));

    const token = jwt.sign({ id: validUser._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    const { password: pass, ...rest } = validUser._doc;

    // 🧠 FIXED COOKIE CONFIG
    res
      .cookie('access_token', token, {
        httpOnly: true,
        secure: true, // required for HTTPS
        sameSite: 'none', // allow cross-site cookie (Render frontend ↔ backend)
      })
      .status(200)
      .json(rest);
  } catch (error) {
    next(error);
  }
};

// 🟢 GOOGLE SIGN IN
export const google = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (user) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });
      const { password: pass, ...rest } = user._doc;
      return res
        .cookie('access_token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
        })
        .status(200)
        .json(rest);
    }

    const generatedPassword =
      Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);

    const newUser = new User({
      username:
        req.body.name.split(' ').join('').toLowerCase() +
        Math.random().toString(36).slice(-4),
      email: req.body.email,
      password: hashedPassword,
      avatar: req.body.photo,
    });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    const { password: pass, ...rest } = newUser._doc;

    res
      .cookie('access_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      })
      .status(200)
      .json(rest);
  } catch (error) {
    next(error);
  }
};

// 🟢 SIGN OUT
export const signOut = async (req, res, next) => {
  try {
    res
      .clearCookie('access_token', {
        secure: true,
        sameSite: 'none',
      })
      .status(200)
      .json('User has been logged out!');
  } catch (error) {
    next(error);
  }
};
