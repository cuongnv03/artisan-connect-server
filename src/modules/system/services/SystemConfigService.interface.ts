import {
  SystemConfig,
  CreateConfigDto,
  UpdateConfigDto,
  ConfigQueryOptions,
  ConfigPaginationResult,
} from '../models/SystemConfig';

export interface ISystemConfigService {
  /**
   * Get config by key
   */
  getConfig(key: string): Promise<SystemConfig | null>;

  /**
   * Get config value by key
   */
  getValue<T = any>(key: string, defaultValue?: T): Promise<T>;

  /**
   * Set config value
   */
  setValue(key: string, value: any, userId?: string, description?: string): Promise<SystemConfig>;

  /**
   * Create new config
   */
  createConfig(data: CreateConfigDto, userId?: string): Promise<SystemConfig>;

  /**
   * Update config
   */
  updateConfig(key: string, data: UpdateConfigDto, userId?: string): Promise<SystemConfig>;

  /**
   * Delete config
   */
  deleteConfig(key: string): Promise<boolean>;

  /**
   * Get all configs with pagination
   */
  getAllConfigs(options?: ConfigQueryOptions): Promise<ConfigPaginationResult>;

  /**
   * Get multiple config values at once
   */
  getMultipleValues(keys: string[]): Promise<Record<string, any>>;

  /**
   * Initialize default configs if they don't exist
   */
  initDefaultConfigs(): Promise<void>;
}
