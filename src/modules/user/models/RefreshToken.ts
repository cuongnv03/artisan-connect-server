/**
 * Refresh token entity
 */
export interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date | null;
}

/**
 * Token creation attributes
 */
export interface TokenCreationAttributes {
  userId: string;
  token: string;
  expiresAt: Date;
}
