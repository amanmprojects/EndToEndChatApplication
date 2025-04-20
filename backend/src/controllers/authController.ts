import { Request, Response } from 'express';
import User from '../models/User';
import { generateToken, AuthRequest } from '../middlewares/auth';

class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;
      
      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, and password are required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }

      // Check if email already exists
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }

      // Check if username already exists
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      
      // Create new user
      const newUser = new User({
        username,
        email,
        password
      });
      
      await newUser.save();
      
      // Generate token
      const token = generateToken(newUser);
      
      return res.status(201).json({
        success: true,
        token,
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          profilePic: newUser.profilePic
        }
      });
      
    } catch (error: any) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to register user', 
        error: error.message 
      });
    }
  }
  
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }
      
      // Generate token
      const token = generateToken(user);
      
      return res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profilePic: user.profilePic
        }
      });
      
    } catch (error: any) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to login', 
        error: error.message 
      });
    }
  }
  
  async getProfile(req: AuthRequest, res: Response) {
    try {
      // Add null check before accessing req.user
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized - User not authenticated' 
        });
      }
      
      const userId = req.user._id;
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      return res.status(200).json({
        success: true,
        user
      });
      
    } catch (error: any) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to get profile', 
        error: error.message 
      });
    }
  }
}

export default AuthController;