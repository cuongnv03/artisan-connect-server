import { BaseService } from '../../../shared/baseClasses/BaseService';
import { ISystemConfigService } from './SystemConfigService.interface';
import { ISystemConfigRepository } from '../repositories/SystemConfigRepository.interface';
import {
  SystemConfig,
  CreateConfigDto,
  UpdateConfigDto,
  ConfigQueryOptions,
  ConfigPaginationResult,
} from '../models/SystemConfig';
import { AppError } from '../../../core/errors/AppError';
import container from '../../../core/di/container';

export class SystemConfigService extends BaseService implements ISystemConfigService {
  private systemConfigRepository: ISystemConfigRepository;

  // Default configs that should be initialized
  private defaultConfigs: Record<string, { value: any; description: string }> = {
    'site.name': {
      value: 'Artisan Connect',
      description: 'Site name displayed in emails and browser title',
    },
    'site.description': {
      value: 'Platform connecting artisans with customers',
      description: 'Site description for SEO and sharing',
    },
    'user.defaultAvatarUrl': {
      value: 'https://via.placeholder.com/150',
      description: 'Default avatar URL for new users',
    },
    'user.autoApproveArtisans': {
      value: false,
      description: 'Whether to auto-approve artisan upgrade requests',
    },
    'social.maxFollowersPerPage': {
      value: 20,
      description: 'Maximum number of followers to display per page',
    },
    'post.populateTags': {
      value: ['handmade', 'craft', 'artisan', 'traditional', 'art'],
      description: 'Popular tags for posts',
    },
    'email.notificationTemplate': {
      value: {
        subject: '{{siteName}} - {{notificationType}}',
        body: 'Hello {{userName}},\n\n{{message}}\n\nRegards,\nThe {{siteName}} Team',
      },
      description: 'Email template for notifications',
    },
  };

  constructor() {
    super([
      { methodName: 'createConfig', errorMessage: 'Failed to create config' },
      { methodName: 'updateConfig', errorMessage: 'Failed to update config' },
      { methodName: 'deleteConfig', errorMessage: 'Failed to delete config' },
      { methodName: 'setValue', errorMessage: 'Failed to set config value' },
    ]);

    this.systemConfigRepository =
      container.resolve<ISystemConfigRepository>('systemConfigRepository');
  }

  /**
   * Get config by key
   */
  async getConfig(key: string): Promise<SystemConfig | null> {
    try {
      return await this.systemConfigRepository.findByKey(key);
    } catch (error) {
      this.logger.error(`Error getting config: ${error}`);
      return null;
    }
  }

  /**
   * Get config value by key
   */
  async getValue<T = any>(key: string, defaultValue?: T): Promise<T> {
    try {
      return await this.systemConfigRepository.getValue<T>(key, defaultValue);
    } catch (error) {
      this.logger.error(`Error getting config value: ${error}`);

      // Check if we have a default in our hardcoded defaults
      if (key in this.defaultConfigs && defaultValue === undefined) {
        return this.defaultConfigs[key].value as unknown as T;
      }

      if (defaultValue !== undefined) {
        return defaultValue;
      }

      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to get config value for "${key}"`, 'SERVICE_ERROR');
    }
  }

  /**
   * Set config value
   */
  async setValue(
    key: string,
    value: any,
    userId?: string,
    description?: string,
  ): Promise<SystemConfig> {
    // Set the config value
    const config = await this.systemConfigRepository.setValue(key, value, userId, description);

    // Log the config update
    this.logger.info(
      `Config value updated: ${key} = ${JSON.stringify(value)} by user ${userId || 'system'}`,
    );

    return config;
  }

  /**
   * Create new config
   */
  async createConfig(data: CreateConfigDto, userId?: string): Promise<SystemConfig> {
    // Create the config
    const config = await this.systemConfigRepository.createConfig(data, userId);

    // Log config creation
    this.logger.info(
      `New config created: ${data.key} = ${JSON.stringify(data.value)} by user ${userId || 'system'}`,
    );

    return config;
  }

  /**
   * Update config
   */
  async updateConfig(key: string, data: UpdateConfigDto, userId?: string): Promise<SystemConfig> {
    // Get current config for logging changes
    const currentConfig = await this.systemConfigRepository.findByKey(key);

    // Update the config
    const config = await this.systemConfigRepository.updateConfig(key, data, userId);

    // Log the config update with changes
    if (currentConfig) {
      this.logger.info(
        `Config ${key} updated by ${userId || 'system'}, old value: ${JSON.stringify(currentConfig.value)}, new value: ${JSON.stringify(data.value)}`,
      );
    } else {
      this.logger.info(
        `Config ${key} updated to ${JSON.stringify(data.value)} by ${userId || 'system'}`,
      );
    }

    return config;
  }

  /**
   * Delete config
   */
  async deleteConfig(key: string): Promise<boolean> {
    try {
      // Delete the config
      const deleted = await this.systemConfigRepository.deleteByKey(key);

      if (deleted) {
        // Log config deletion
        this.logger.info(`Config deleted: ${key}`);
      }

      return deleted;
    } catch (error) {
      this.logger.error(`Error deleting config: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to delete config "${key}"`, 'SERVICE_ERROR');
    }
  }

  /**
   * Get all configs with pagination
   */
  async getAllConfigs(options?: ConfigQueryOptions): Promise<ConfigPaginationResult> {
    try {
      return await this.systemConfigRepository.getConfigs(options);
    } catch (error) {
      this.logger.error(`Error getting all configs: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get configurations', 'SERVICE_ERROR');
    }
  }

  /**
   * Get multiple config values at once
   */
  async getMultipleValues(keys: string[]): Promise<Record<string, any>> {
    try {
      if (!keys.length) return {};
      return await this.systemConfigRepository.getMultipleValues(keys);
    } catch (error) {
      this.logger.error(`Error getting multiple config values: ${error}`);
      if (error instanceof AppError) throw error;
      throw AppError.internal('Failed to get configuration values', 'SERVICE_ERROR');
    }
  }

  /**
   * Initialize default configs if they don't exist
   */
  async initDefaultConfigs(): Promise<void> {
    try {
      this.logger.info('Initializing default system configurations');

      for (const [key, config] of Object.entries(this.defaultConfigs)) {
        // Check if config exists
        const existing = await this.systemConfigRepository.findByKey(key);

        if (!existing) {
          // Create config with default value
          await this.systemConfigRepository.createConfig({
            key,
            value: config.value,
            description: config.description,
          });
          this.logger.info(`Created default config: ${key}`);
        }
      }

      this.logger.info('Default system configurations initialized');
    } catch (error) {
      this.logger.error(`Error initializing default configs: ${error}`);
      // Don't throw error here, just log it as this is typically called during startup
    }
  }
}
