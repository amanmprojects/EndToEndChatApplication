import express from 'express';
import UserController from '../controllers/userController';
import { authenticateJwt, AuthRequest } from '../middlewares/auth';

const router = express.Router();
const userController = new UserController();

function asyncHandler(fn: any) {
  return function (req: express.Request, res: express.Response, next: express.NextFunction) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Search users by username or email
router.get('/search', authenticateJwt, asyncHandler(userController.searchUsers.bind(userController)));

// Get user by ID
router.get('/:userId', authenticateJwt, asyncHandler(userController.getUserById.bind(userController)));

export default router;