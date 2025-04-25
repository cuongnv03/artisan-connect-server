export interface EmailVerification {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface CreateEmailVerificationTokenDto {
  userId: string;
  token: string;
  expiresAt: Date;
}
