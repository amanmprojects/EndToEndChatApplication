import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import User, { IUser } from '../models/User';
import mongoose, { Types } from 'mongoose';

// Get JWT secret from environment variables with fallback
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
console.log(`Using JWT secret: ${JWT_SECRET.substring(0, 3)}... (first 3 chars)`);

// JWT strategy configuration
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
};

// Define payload type for better type safety
interface JwtPayload {
  id: string;
  username: string;
  exp?: number;
}

// Configure passport with JWT strategy
passport.use(
  new JwtStrategy(jwtOptions, async (payload: JwtPayload, done) => {
    try {
      console.log('JWT payload received:', {
        id: payload.id,
        username: payload.username,
        exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'undefined'
      });
      
      const user = await User.findById(payload.id);
      
      if (user) {
        // Ensure user is typed as IUser
        const typedUser = user as IUser;
        // Use String() for safer conversion of ObjectId to string
        console.log('User found in database:', String(typedUser._id));
        return done(null, typedUser);
      }
      
      console.log('User not found in database for ID:', payload.id);
      return done(null, false);
    } catch (error) {
      console.error('Error in JWT strategy:', error);
      return done(error, false);
    }
  })
);

// Custom middleware for debugging JWT token
export const logJwtToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    console.log('Received auth token (first 10 chars):', token.substring(0, 10) + '...');
    
    try {
      // Just verify to check if valid, don't use the decoded value here
      jwt.verify(token, JWT_SECRET);
      console.log('Token is valid');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Token verification failed:', errorMessage);
    }
  } else {
    console.log('No authorization header found in request');
  }
  
  next();
};

// Middleware to authenticate JWT
export const authenticateJwt = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: unknown, user: IUser | false, info: { message: string } | undefined) => {
    if (err) {
      console.error('JWT authentication error:', err);
      return next(err);
    }
    
    if (!user) {
      console.log('JWT authentication failed:', info?.message || 'Unknown reason');
      return res.status(401).send('Unauthorized');
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

// Interface for authenticated request
export interface AuthRequest extends Request {
  user?: IUser;
}

// Generate JWT token
export const generateToken = (user: IUser) => {
  // Use String() for safer conversion of ObjectId to string
  console.log('Generating token for user:', String(user._id));
  return jwt.sign(
    { id: user._id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};