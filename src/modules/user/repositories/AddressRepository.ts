import { PrismaClient } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { IAddressRepository } from './AddressRepository.interface';
import { Address, CreateAddressDto, UpdateAddressDto } from '../models/Address';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class AddressRepository
  extends BasePrismaRepository<Address, string>
  implements IAddressRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'address');
  }

  async getAddressesByProfileId(profileId: string): Promise<Address[]> {
    try {
      const addresses = await this.prisma.address.findMany({
        where: { profileId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      });

      return addresses as Address[];
    } catch (error) {
      this.logger.error(`Error getting addresses by profile ID: ${error}`);
      throw AppError.internal('Failed to get addresses', 'DATABASE_ERROR');
    }
  }

  async createAddress(profileId: string, data: CreateAddressDto): Promise<Address> {
    try {
      // Check if profile exists
      const profile = await this.prisma.profile.findUnique({
        where: { id: profileId },
        select: { id: true },
      });

      if (!profile) {
        throw AppError.notFound('Profile not found', 'PROFILE_NOT_FOUND');
      }

      // Create address in transaction
      return await this.prisma.$transaction(async (tx) => {
        // If this is set as default, set all other addresses as non-default
        if (data.isDefault) {
          await tx.address.updateMany({
            where: { profileId },
            data: { isDefault: false },
          });
        }

        // If this is the first address, make it default
        const addressCount = await tx.address.count({
          where: { profileId },
        });

        const makeDefault = data.isDefault || addressCount === 0;

        // Create the address
        const address = await tx.address.create({
          data: {
            profileId,
            fullName: data.fullName,
            phone: data.phone,
            street: data.street,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            country: data.country,
            isDefault: makeDefault,
          },
        });

        return address as Address;
      });
    } catch (error) {
      this.logger.error(`Error creating address: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to create address', 'DATABASE_ERROR');
    }
  }

  async updateAddress(id: string, data: UpdateAddressDto): Promise<Address> {
    try {
      // Get address to check if it exists
      const address = await this.prisma.address.findUnique({
        where: { id },
        select: { id: true, profileId: true },
      });

      if (!address) {
        throw AppError.notFound('Address not found', 'ADDRESS_NOT_FOUND');
      }

      // Update in transaction if isDefault is changing
      if (data.isDefault) {
        return await this.prisma.$transaction(async (tx) => {
          // Set all other addresses as non-default
          await tx.address.updateMany({
            where: {
              profileId: address.profileId,
              id: { not: id },
            },
            data: { isDefault: false },
          });

          // Update the address
          const updatedAddress = await tx.address.update({
            where: { id },
            data,
          });

          return updatedAddress as Address;
        });
      } else {
        // Simple update
        const updatedAddress = await this.prisma.address.update({
          where: { id },
          data,
        });

        return updatedAddress as Address;
      }
    } catch (error) {
      this.logger.error(`Error updating address: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to update address', 'DATABASE_ERROR');
    }
  }

  async setAsDefault(id: string, profileId: string): Promise<Address> {
    try {
      // Update in transaction
      return await this.prisma.$transaction(async (tx) => {
        // Set all addresses as non-default
        await tx.address.updateMany({
          where: { profileId },
          data: { isDefault: false },
        });

        // Set the specified address as default
        const address = await tx.address.update({
          where: { id },
          data: { isDefault: true },
        });

        return address as Address;
      });
    } catch (error) {
      this.logger.error(`Error setting address as default: ${error}`);
      throw AppError.internal('Failed to set address as default', 'DATABASE_ERROR');
    }
  }

  async belongsToProfile(id: string, profileId: string): Promise<boolean> {
    try {
      const address = await this.prisma.address.findFirst({
        where: {
          id,
          profileId,
        },
        select: { id: true },
      });

      return !!address;
    } catch (error) {
      this.logger.error(`Error checking if address belongs to profile: ${error}`);
      return false;
    }
  }

  async getDefaultAddress(profileId: string): Promise<Address | null> {
    try {
      const address = await this.prisma.address.findFirst({
        where: {
          profileId,
          isDefault: true,
        },
      });

      return address as Address | null;
    } catch (error) {
      this.logger.error(`Error getting default address: ${error}`);
      return null;
    }
  }
}
