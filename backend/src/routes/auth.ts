import express from 'express';
import AuthController from '../controllers/authController';
import { authenticateJwt } from '../middlewares/auth';

const router = express.Router();
const authController = new AuthController();

function asyncHandler(fn: any) {
	return function (req: express.Request, res: express.Response, next: express.NextFunction) {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}

router.post('/register', asyncHandler(authController.register.bind(authController)));
router.post('/login', asyncHandler(authController.login.bind(authController)));
router.get('/profile', authenticateJwt, asyncHandler(authController.getProfile.bind(authController)));

export default router;