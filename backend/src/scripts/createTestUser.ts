import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chat-app')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      console.log('Test user already exists!');
      return;
    }
    
    // Create a new test user
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    });
    
    // Save to database
    await testUser.save();
    
    console.log('Test user created successfully:');
    console.log({
      username: testUser.username,
      email: testUser.email,
      id: testUser._id
    });
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
createTestUser();