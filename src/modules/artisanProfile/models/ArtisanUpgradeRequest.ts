import { UpgradeRequestStatus } from '../valueObjects/ArtisanProfileEnums';

/**
 * Artisan Upgrade Request entity
 */
export interface ArtisanUpgradeRequest {
  id: string;
  userId: string;
  shopName: string;
  shopDescription?: string | null;
  specialties: string[];
  experience?: number | null;
  website?: string | null;
  socialMedia?: Record<string, string> | null;
  reason?: string | null;
  status: UpgradeRequestStatus;
  adminNotes?: string | null;
  reviewedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Artisan Upgrade Request with User info
 */
export interface ArtisanUpgradeRequestWithUser extends ArtisanUpgradeRequest {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  };
}
