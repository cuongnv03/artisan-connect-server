import { PrismaClient } from '@prisma/client';
import { BasePrismaRepository } from '../../../shared/baseClasses/BasePrismaRepository';
import { ISystemConfigRepository } from './SystemConfigRepository.interface';
import {
  SystemConfig,
  CreateConfigDto,
  UpdateConfigDto,
  ConfigQueryOptions,
  ConfigPaginationResult,
} from '../models/SystemConfig';
import { AppError } from '../../../core/errors/AppError';
import { Logger } from '../../../core/logging/Logger';

export class SystemConfigRepository
  extends BasePrismaRepository<SystemConfig, string>
  implements ISystemConfigRepository
{
  private logger = Logger.getInstance();

  constructor(prisma: PrismaClient) {
    super(prisma, 'systemConfig');
  }

  /**
   * Find config by key
   */
  async findByKey(key: string): Promise<SystemConfig | null> {
    try {
      const config = await this.prisma.systemConfig.findUnique({
        where: { key },
      });

      return config as SystemConfig | null;
    } catch (error) {
      this.logger.error(`Error finding config by key: ${error}`);
      return null;
    }
  }

  /**
   * Get config value by key
   */
  async getValue<T = any>(key: string, defaultValue?: T): Promise<T> {
    try {
      const config = await this.prisma.systemConfig.findUnique({
        where: { key },
        select: { value: true },
      });

      if (!config) {
        if (defaultValue !== undefined) {
          return defaultValue;
        }
        throw new AppError(`Config key "${key}" not found`, 404, 'CONFIG_NOT_FOUND');
      }

      return config.value as unknown as T;
    } catch (error) {
      this.logger.error(`Error getting config value: ${error}`);
      if (error instanceof AppError) throw error;
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new AppError('Failed to get config value', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Set config value
   */
  async setValue(
    key: string,
    value: any,
    updatedBy?: string,
    description?: string,
  ): Promise<SystemConfig> {
    try {
      // Check if config exists
      const existing = await this.prisma.systemConfig.findUnique({
        where: { key },
      });

      if (existing) {
        // Update existing config
        return (await this.prisma.systemConfig.update({
          where: { key },
          data: {
            value: value as any,
            updatedBy,
            description: description !== undefined ? description : existing.description,
          },
        })) as SystemConfig;
      } else {
        // Create new config
        return (await this.prisma.systemConfig.create({
          data: {
            key,
            value: value as any,
            updatedBy,
            description,
          },
        })) as SystemConfig;
      }
    } catch (error) {
      this.logger.error(`Error setting config value: ${error}`);
      throw new AppError('Failed to set config value', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Create config
   */
  async createConfig(data: CreateConfigDto, createdBy?: string): Promise<SystemConfig> {
    try {
      // Check if key already exists
      const existing = await this.prisma.systemConfig.findUnique({
        where: { key: data.key },
      });

      if (existing) {
        throw new AppError(`Config key "${data.key}" already exists`, 409, 'CONFIG_EXISTS');
      }

      // Create config
      return (await this.prisma.systemConfig.create({
        data: {
          key: data.key,
          value: data.value as any,
          description: data.description,
          updatedBy: createdBy,
        },
      })) as SystemConfig;
    } catch (error) {
      this.logger.error(`Error creating config: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to create config', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Update config
   */
  async updateConfig(
    key: string,
    data: UpdateConfigDto,
    updatedBy?: string,
  ): Promise<SystemConfig> {
    try {
      // Check if config exists
      const existing = await this.prisma.systemConfig.findUnique({
        where: { key },
      });

      if (!existing) {
        throw new AppError(`Config key "${key}" not found`, 404, 'CONFIG_NOT_FOUND');
      }

      // Update config
      return (await this.prisma.systemConfig.update({
        where: { key },
        data: {
          value: data.value as any,
          description: data.description !== undefined ? data.description : existing.description,
          updatedBy,
        },
      })) as SystemConfig;
    } catch (error) {
      this.logger.error(`Error updating config: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update config', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get many configs
   */
  async getConfigs(options?: ConfigQueryOptions): Promise<ConfigPaginationResult> {
    try {
      const { page = 1, limit = 20, search } = options || {};

      // Build where clause
      const where: any = {};
      if (search) {
        where.OR = [
          { key: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Count total configs
      const total = await this.prisma.systemConfig.count({ where });

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      // Get configs
      const configs = await this.prisma.systemConfig.findMany({
        where,
        orderBy: { key: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        data: configs as SystemConfig[],
        meta: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting configs: ${error}`);
      throw new AppError('Failed to get configs', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Delete config by key
   */
  async deleteByKey(key: string): Promise<boolean> {
    try {
      // Check if config exists
      const existing = await this.prisma.systemConfig.findUnique({
        where: { key },
      });

      if (!existing) {
        throw new AppError(`Config key "${key}" not found`, 404, 'CONFIG_NOT_FOUND');
      }

      // Delete config
      await this.prisma.systemConfig.delete({
        where: { key },
      });

      return true;
    } catch (error) {
      this.logger.error(`Error deleting config: ${error}`);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete config', 500, 'DATABASE_ERROR');
    }
  }

  /**
   * Get multiple config values by keys
   */
  async getMultipleValues(keys: string[]): Promise<Record<string, any>> {
    try {
      if (!keys.length) return {};

      const configs = await this.prisma.systemConfig.findMany({
        where: {
          key: { in: keys },
        },
        select: {
          key: true,
          value: true,
        },
      });

      // Convert to record
      const result: Record<string, any> = {};
      for (const config of configs) {
        result[config.key] = config.value;
      }

      return result;
    } catch (error) {
      this.logger.error(`Error getting multiple config values: ${error}`);
      throw new AppError('Failed to get config values', 500, 'DATABASE_ERROR');
    }
  }
}
