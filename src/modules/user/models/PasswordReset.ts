export interface PasswordReset {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface CreatePasswordResetTokenDto {
  userId: string;
  token: string;
  expiresAt: Date;
}
