export interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date | null;
}

export interface TokenCreationAttributes {
  userId: string;
  token: string;
  expiresAt: Date;
}
