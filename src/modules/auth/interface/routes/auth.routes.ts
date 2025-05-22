import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

// Controllers
import { RegisterController } from '../controllers/RegisterController';
import { LoginController } from '../controllers/LoginController';
import { LogoutController } from '../controllers/LogoutController';
import { RefreshTokenController } from '../controllers/RefreshTokenController';
import { ForgotPasswordController } from '../controllers/ForgotPasswordController';
import { ResetPasswordController } from '../controllers/ResetPasswordController';
import { SendVerificationEmailController } from '../controllers/SendVerificationEmailController';
import { ChangePasswordController } from '../controllers/ChangePasswordController';
import { VerifyEmailController } from '../controllers/VerifyEmailController';
import { GetCurrentUserController } from '../controllers/GetCurrentUserController';

const router = Router();

// Initialize controllers
const registerController = new RegisterController();
const loginController = new LoginController();
const logoutController = new LogoutController();
const refreshTokenController = new RefreshTokenController();
const forgotPasswordController = new ForgotPasswordController();
const resetPasswordController = new ResetPasswordController();
const sendVerificationEmailController = new SendVerificationEmailController();
const changePasswordController = new ChangePasswordController();
const verifyEmailController = new VerifyEmailController();
const getCurrentUserController = new GetCurrentUserController();

// Public routes
router.post('/register', validate(registerSchema), registerController.execute);
router.post('/login', validate(loginSchema), loginController.execute);
router.post('/logout', logoutController.execute);
router.post('/refresh-token', validate(refreshTokenSchema), refreshTokenController.execute);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPasswordController.execute);
router.post('/reset-password', validate(resetPasswordSchema), resetPasswordController.execute);
router.get('/verify-email/:token', verifyEmailController.execute);

// Protected routes
router.post('/send-verification-email', authenticate, sendVerificationEmailController.execute);
router.get('/me', authenticate, getCurrentUserController.execute);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  changePasswordController.execute,
);

export default router;
