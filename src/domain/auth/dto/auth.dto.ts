/**
 * Register user DTO
 */
export interface RegisterUserDto {
  email: string;
  username?: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

/**
 * Login user DTO
 */
export interface LoginUserDto {
  emailOrUsername: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Refresh token DTO
 */
export interface RefreshTokenDto {
  refreshToken: string;
}

/**
 * Reset password DTO
 */
export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

/**
 * Forgot password DTO
 */
export interface ForgotPasswordDto {
  email: string;
}

/**
 * Change password DTO
 */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

/**
 * Authentication result DTO
 */
export interface AuthResultDto {
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    avatarUrl?: string | null;
  };
  accessToken: string;
  refreshToken: string;
}
