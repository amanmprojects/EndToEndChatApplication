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
const User_1 = __importDefault(require("../models/User"));
const auth_1 = require("../middlewares/auth");
class AuthController {
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const existingEmail = yield User_1.default.findOne({ email });
                if (existingEmail) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already in use'
                    });
                }
                // Check if username already exists
                const existingUsername = yield User_1.default.findOne({ username });
                if (existingUsername) {
                    return res.status(400).json({
                        success: false,
                        message: 'Username already taken'
                    });
                }
                // Create new user
                const newUser = new User_1.default({
                    username,
                    email,
                    password
                });
                yield newUser.save();
                // Generate token
                const token = (0, auth_1.generateToken)(newUser);
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
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to register user',
                    error: error.message
                });
            }
        });
    }
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                // Find user by email
                const user = yield User_1.default.findOne({ email });
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        message: 'User not found'
                    });
                }
                // Check password
                const isPasswordValid = yield user.comparePassword(password);
                if (!isPasswordValid) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid credentials'
                    });
                }
                // Generate token
                const token = (0, auth_1.generateToken)(user);
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
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to login',
                    error: error.message
                });
            }
        });
    }
    getProfile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Add null check before accessing req.user
                if (!req.user) {
                    return res.status(401).json({
                        success: false,
                        message: 'Unauthorized - User not authenticated'
                    });
                }
                const userId = req.user._id;
                const user = yield User_1.default.findById(userId).select('-password');
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
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to get profile',
                    error: error.message
                });
            }
        });
    }
}
exports.default = AuthController;
