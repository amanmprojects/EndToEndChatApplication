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
class UserController {
    // Search for users by username or email
    searchUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { query } = req.query;
                const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!query) {
                    return res.status(400).json({
                        success: false,
                        message: 'Search query is required'
                    });
                }
                // Create a regex search and exclude the current user from results
                const users = yield User_1.default.find({
                    $and: [
                        { _id: { $ne: currentUserId } }, // Exclude current user
                        {
                            $or: [
                                { username: { $regex: query, $options: 'i' } },
                                { email: { $regex: query, $options: 'i' } }
                            ]
                        }
                    ]
                })
                    .select('_id username email profilePic') // Only return necessary fields
                    .limit(10); // Limit results for performance
                return res.status(200).json({
                    success: true,
                    users
                });
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to search users',
                    error: error.message
                });
            }
        });
    }
    // Get user by ID
    getUserById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const user = yield User_1.default.findById(userId)
                    .select('-password'); // Exclude password
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
                    message: 'Failed to get user',
                    error: error.message
                });
            }
        });
    }
}
exports.default = UserController;
