import { Request, Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth';

class UserController {
  // Search for users by username or email
  async searchUsers(req: AuthRequest, res: Response) {
    try {
      const { query } = req.query;
      const currentUserId = req.user?._id;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      // Create a regex search and exclude the current user from results
      const users = await User.find({
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
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to search users',
        error: error.message
      });
    }
  }

  // Get user by ID
  async getUserById(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId)
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
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get user',
        error: error.message
      });
    }
  }
}

export default UserController;