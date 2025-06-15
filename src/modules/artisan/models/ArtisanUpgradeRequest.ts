import { UpgradeRequestStatus } from './ArtisanEnums';

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
  images: string[];
  certificates: string[];
  identityProof?: string | null;
  status: UpgradeRequestStatus;
  adminNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArtisanUpgradeRequestWithUser extends ArtisanUpgradeRequest {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    avatarUrl?: string | null;
  };
}

export interface CreateUpgradeRequestDto {
  shopName: string;
  shopDescription?: string;
  specialties?: string[];
  experience?: number;
  website?: string;
  socialMedia?: Record<string, string>;
  reason?: string;
  images?: string[];
  certificates?: string[];
  identityProof?: string;
}

export interface ReviewUpgradeRequestDto {
  status: UpgradeRequestStatus;
  adminNotes?: string;
  reviewedBy: string;
}
