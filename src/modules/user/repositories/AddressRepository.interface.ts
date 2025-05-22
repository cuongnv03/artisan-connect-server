import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import { Address, CreateAddressDto, UpdateAddressDto } from '../models/Address';

export interface IAddressRepository extends BaseRepository<Address, string> {
  getAddressesByProfileId(profileId: string): Promise<Address[]>;
  createAddress(profileId: string, data: CreateAddressDto): Promise<Address>;
  updateAddress(id: string, data: UpdateAddressDto): Promise<Address>;
  setAsDefault(id: string, profileId: string): Promise<Address>;
  belongsToProfile(id: string, profileId: string): Promise<boolean>;
  getDefaultAddress(profileId: string): Promise<Address | null>;
}
