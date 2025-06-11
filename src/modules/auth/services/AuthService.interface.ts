import { User } from '../models/User';
import {
  RegisterUserDto,
  LoginUserDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  AuthResultDto,
} from '../models/AuthDto';

export interface IAuthService {
  register(data: RegisterUserDto): Promise<Omit<User, 'password'>>;
  login(credentials: LoginUserDto): Promise<AuthResultDto | null>;
  logout(refreshToken: string): Promise<boolean>;
  refreshToken(refreshToken: string): Promise<{ accessToken: string; user?: any } | null>;
  getUserById(id: string): Promise<Omit<User, 'password'> | null>;
  forgotPassword(data: ForgotPasswordDto): Promise<boolean>;
  resetPassword(data: ResetPasswordDto): Promise<boolean>;
  sendVerificationEmail(userId: string): Promise<boolean>;
  changePassword(userId: string, data: ChangePasswordDto): Promise<boolean>;
  verifyEmail(token: string): Promise<boolean>;
}
