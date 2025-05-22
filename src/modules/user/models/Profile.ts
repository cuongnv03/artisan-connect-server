export interface Profile {
  id: string;
  userId: string;
  coverUrl?: string | null;
  location?: string | null;
  website?: string | null;
  dateOfBirth?: Date | null;
  gender?: string | null;
  socialLinks?: Record<string, string> | null;
  preferences?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileWithUser extends Profile {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    avatarUrl?: string | null;
  };
}

export interface UpdateProfileDto {
  coverUrl?: string | null;
  location?: string | null;
  website?: string | null;
  dateOfBirth?: Date | string | null;
  gender?: string | null;
  socialLinks?: Record<string, string> | null;
  preferences?: Record<string, any> | null;
}
