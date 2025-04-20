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
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("../models/User"));
// Load environment variables
dotenv_1.default.config();
// Connect to MongoDB
mongoose_1.default.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chat-app')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
function createTestUser() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Check if test user already exists
            const existingUser = yield User_1.default.findOne({ email: 'test@example.com' });
            if (existingUser) {
                console.log('Test user already exists!');
                return;
            }
            // Create a new test user
            const testUser = new User_1.default({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });
            // Save to database
            yield testUser.save();
            console.log('Test user created successfully:');
            console.log({
                username: testUser.username,
                email: testUser.email,
                id: testUser._id
            });
        }
        catch (error) {
            console.error('Error creating test user:', error);
        }
        finally {
            // Disconnect from MongoDB
            yield mongoose_1.default.disconnect();
            console.log('Disconnected from MongoDB');
        }
    });
}
// Run the function
createTestUser();
