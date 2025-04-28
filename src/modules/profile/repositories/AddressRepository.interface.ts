import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import { Address, CreateAddressDto, UpdateAddressDto } from '../models/Address';

export interface IAddressRepository extends BaseRepository<Address, string> {
  /**
   * Get addresses by profile ID
   */
  getAddressesByProfileId(profileId: string): Promise<Address[]>;

  /**
   * Create address for a profile
   */
  createAddress(profileId: string, data: CreateAddressDto): Promise<Address>;

  /**
   * Update address
   */
  updateAddress(id: string, data: UpdateAddressDto): Promise<Address>;

  /**
   * Set address as default
   */
  setAsDefault(id: string, profileId: string): Promise<Address>;

  /**
   * Check if address belongs to profile
   */
  belongsToProfile(id: string, profileId: string): Promise<boolean>;

  /**
   * Get default address for a profile
   */
  getDefaultAddress(profileId: string): Promise<Address | null>;
}
