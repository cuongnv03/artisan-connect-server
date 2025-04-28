import { Profile, ProfileWithUser, UpdateProfileDto } from '../models/Profile';
import { Address, CreateAddressDto, UpdateAddressDto } from '../models/Address';

export interface IProfileService {
  /**
   * Get profile by user ID
   */
  getProfileByUserId(userId: string): Promise<ProfileWithUser | null>;

  /**
   * Update a profile
   */
  updateProfile(userId: string, data: UpdateProfileDto): Promise<ProfileWithUser>;

  /**
   * Get addresses by user ID
   */
  getAddressesByUserId(userId: string): Promise<Address[]>;

  /**
   * Create an address
   */
  createAddress(userId: string, data: CreateAddressDto): Promise<Address>;

  /**
   * Update an address
   */
  updateAddress(id: string, userId: string, data: UpdateAddressDto): Promise<Address>;

  /**
   * Delete an address
   */
  deleteAddress(id: string, userId: string): Promise<boolean>;

  /**
   * Set address as default
   */
  setAddressAsDefault(id: string, userId: string): Promise<Address>;

  /**
   * Get default address for a user
   */
  getDefaultAddress(userId: string): Promise<Address | null>;
}
