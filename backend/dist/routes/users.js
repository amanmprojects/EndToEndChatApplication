"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = __importDefault(require("../controllers/userController"));
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
const userController = new userController_1.default();
function asyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
// Search users by username or email
router.get('/search', auth_1.authenticateJwt, asyncHandler(userController.searchUsers.bind(userController)));
// Get user by ID
router.get('/:userId', auth_1.authenticateJwt, asyncHandler(userController.getUserById.bind(userController)));
exports.default = router;
