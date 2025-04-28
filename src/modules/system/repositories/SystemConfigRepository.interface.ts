import { BaseRepository } from '../../../shared/interfaces/BaseRepository';
import {
  SystemConfig,
  CreateConfigDto,
  UpdateConfigDto,
  ConfigQueryOptions,
  ConfigPaginationResult,
} from '../models/SystemConfig';

export interface ISystemConfigRepository extends BaseRepository<SystemConfig, string> {
  /**
   * Find config by key
   */
  findByKey(key: string): Promise<SystemConfig | null>;

  /**
   * Get config value by key
   */
  getValue<T = any>(key: string, defaultValue?: T): Promise<T>;

  /**
   * Set config value
   */
  setValue(
    key: string,
    value: any,
    updatedBy?: string,
    description?: string,
  ): Promise<SystemConfig>;

  /**
   * Create config
   */
  createConfig(data: CreateConfigDto, createdBy?: string): Promise<SystemConfig>;

  /**
   * Update config
   */
  updateConfig(key: string, data: UpdateConfigDto, updatedBy?: string): Promise<SystemConfig>;

  /**
   * Get many configs
   */
  getConfigs(options?: ConfigQueryOptions): Promise<ConfigPaginationResult>;

  /**
   * Delete config by key
   */
  deleteByKey(key: string): Promise<boolean>;

  /**
   * Get multiple config values by keys
   */
  getMultipleValues(keys: string[]): Promise<Record<string, any>>;
}
