"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.authenticateJwt = exports.logJwtToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const passport_1 = __importDefault(require("passport"));
const passport_jwt_1 = require("passport-jwt");
const User_1 = __importDefault(require("../models/User"));
// Get JWT secret from environment variables with fallback
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
console.log(`Using JWT secret: ${JWT_SECRET.substring(0, 3)}... (first 3 chars)`);
// JWT strategy configuration
const jwtOptions = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET
};
// Configure passport with JWT strategy
passport_1.default.use(new passport_jwt_1.Strategy(jwtOptions, (payload, done) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('JWT payload received:', {
            id: payload.id,
            username: payload.username,
            exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'undefined'
        });
        const user = yield User_1.default.findById(payload.id);
        if (user) {
            // Ensure user is typed as IUser
            const typedUser = user;
            // Use String() for safer conversion of ObjectId to string
            console.log('User found in database:', String(typedUser._id));
            return done(null, typedUser);
        }
        console.log('User not found in database for ID:', payload.id);
        return done(null, false);
    }
    catch (error) {
        console.error('Error in JWT strategy:', error);
        return done(error, false);
    }
})));
// Custom middleware for debugging JWT token
const logJwtToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        console.log('Received auth token (first 10 chars):', token.substring(0, 10) + '...');
        try {
            // Just verify to check if valid, don't use the decoded value here
            jsonwebtoken_1.default.verify(token, JWT_SECRET);
            console.log('Token is valid');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Token verification failed:', errorMessage);
        }
    }
    else {
        console.log('No authorization header found in request');
    }
    next();
};
exports.logJwtToken = logJwtToken;
// Middleware to authenticate JWT
const authenticateJwt = (req, res, next) => {
    passport_1.default.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            console.error('JWT authentication error:', err);
            return next(err);
        }
        if (!user) {
            console.log('JWT authentication failed:', (info === null || info === void 0 ? void 0 : info.message) || 'Unknown reason');
            return res.status(401).send('Unauthorized');
        }
        req.user = user;
        next();
    })(req, res, next);
};
exports.authenticateJwt = authenticateJwt;
// Generate JWT token
const generateToken = (user) => {
    // Use String() for safer conversion of ObjectId to string
    console.log('Generating token for user:', String(user._id));
    return jsonwebtoken_1.default.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
};
exports.generateToken = generateToken;
