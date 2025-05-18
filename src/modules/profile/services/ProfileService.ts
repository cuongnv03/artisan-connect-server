import { BaseService } from '../../../shared/baseClasses/BaseService';
import { IProfileService } from './ProfileService.interface';
import { IProfileRepository } from '../repositories/ProfileRepository.interface';
import { IAddressRepository } from '../repositories/AddressRepository.interface';
import { IUserRepository } from '../../user/repositories/UserRepository.interface';
import { Profile, ProfileWithUser, UpdateProfileDto } from '../models/Profile';
import { Address, CreateAddressDto, UpdateAddressDto } from '../models/Address';
import { AppError } from '../../../core/errors/AppError';
import container from '../../../core/di/container';

export class ProfileService extends BaseService implements IProfileService {
  private profileRepository: IProfileRepository;
  private addressRepository: IAddressRepository;
  private userRepository: IUserRepository;

  constructor() {
    super([
      { methodName: 'updateProfile', errorMessage: 'Failed to update profile' },
      { methodName: 'createAddress', errorMessage: 'Failed to create address' },
      { methodName: 'updateAddress', errorMessage: 'Failed to update address' },
      { methodName: 'deleteAddress', errorMessage: 'Failed to delete address' },
      { methodName: 'setAddressAsDefault', errorMessage: 'Failed to set address as default' },
    ]);

    this.profileRepository = container.resolve<IProfileRepository>('profileRepository');
    this.addressRepository = container.resolve<IAddressRepository>('addressRepository');
    this.userRepository = container.resolve<IUserRepository>('userRepository');
  }

  /**
   * Get profile by user ID
   */
  async getProfileByUserId(userId: string): Promise<ProfileWithUser | null> {
    try {
      // Verify user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found', 'USER_NOT_FOUND');
      }

      const profile = await this.profileRepository.findByUserId(userId);

      if (!profile) {
        // Auto-create profile if not exists
        await this.profileRepository.ensureProfile(userId);
        return await this.profileRepository.findByUserId(userId);
      }

      return profile;
    } catch (error) {
      this.logger.error(`Error getting profile: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get profile', 'SERVICE_ERROR');
    }
  }

  /**
   * Update a profile
   */
  async updateProfile(userId: string, data: UpdateProfileDto): Promise<ProfileWithUser> {
    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found', 'USER_NOT_FOUND');
    }

    const profile = await this.profileRepository.updateProfile(userId, data);
    this.logger.info(`Profile updated for user: ${userId}`);

    return profile;
  }

  /**
   * Get addresses by user ID
   */
  async getAddressesByUserId(userId: string): Promise<Address[]> {
    try {
      // Ensure profile exists
      const profile = await this.profileRepository.ensureProfile(userId);

      // Get addresses
      return await this.addressRepository.getAddressesByProfileId(profile.id);
    } catch (error) {
      this.logger.error(`Error getting addresses: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get addresses', 'SERVICE_ERROR');
    }
  }

  /**
   * Create an address
   */
  async createAddress(userId: string, data: CreateAddressDto): Promise<Address> {
    // Ensure profile exists
    const profile = await this.profileRepository.ensureProfile(userId);

    // Create address
    const address = await this.addressRepository.createAddress(profile.id, data);
    this.logger.info(`Address created for user: ${userId}`);

    return address;
  }

  /**
   * Update an address
   */
  async updateAddress(id: string, userId: string, data: UpdateAddressDto): Promise<Address> {
    // Ensure profile exists
    const profile = await this.profileRepository.ensureProfile(userId);

    // Check if address belongs to this profile
    const belongsToProfile = await this.addressRepository.belongsToProfile(id, profile.id);
    if (!belongsToProfile) {
      throw AppError.forbidden('You can only update your own addresses', 'FORBIDDEN_ACTION');
    }

    // Update address
    const updatedAddress = await this.addressRepository.updateAddress(id, data);
    this.logger.info(`Address ${id} updated for user: ${userId}`);

    return updatedAddress;
  }

  /**
   * Delete an address
   */
  async deleteAddress(id: string, userId: string): Promise<boolean> {
    try {
      // Ensure profile exists
      const profile = await this.profileRepository.ensureProfile(userId);

      // Check if address belongs to this profile
      const belongsToProfile = await this.addressRepository.belongsToProfile(id, profile.id);
      if (!belongsToProfile) {
        throw AppError.forbidden('You can only delete your own addresses', 'FORBIDDEN_ACTION');
      }

      // Delete address
      await this.addressRepository.delete(id);
      this.logger.info(`Address ${id} deleted for user: ${userId}`);

      return true;
    } catch (error) {
      this.logger.error(`Error deleting address: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to delete address', 'SERVICE_ERROR');
    }
  }

  /**
   * Set address as default
   */
  async setAddressAsDefault(id: string, userId: string): Promise<Address> {
    // Ensure profile exists
    const profile = await this.profileRepository.ensureProfile(userId);

    // Check if address belongs to this profile
    const belongsToProfile = await this.addressRepository.belongsToProfile(id, profile.id);
    if (!belongsToProfile) {
      throw AppError.forbidden('You can only update your own addresses', 'FORBIDDEN_ACTION');
    }

    // Set as default
    const address = await this.addressRepository.setAsDefault(id, profile.id);
    this.logger.info(`Address ${id} set as default for user: ${userId}`);

    return address;
  }

  /**
   * Get default address for a user
   */
  async getDefaultAddress(userId: string): Promise<Address | null> {
    try {
      // Ensure profile exists
      const profile = await this.profileRepository.ensureProfile(userId);

      // Get default address
      return await this.addressRepository.getDefaultAddress(profile.id);
    } catch (error) {
      this.logger.error(`Error getting default address: ${error}`);
      if (error instanceof AppError) throw error;
      return null;
    }
  }
}
