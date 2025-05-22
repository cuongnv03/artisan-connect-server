export interface RegisterUserDto {
  email: string;
  username?: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface LoginUserDto {
  emailOrUsername: string;
  password: string;
  rememberMe?: boolean;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

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
