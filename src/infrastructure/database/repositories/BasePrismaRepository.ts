import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../../../domain/repositories/BaseRepository';

/**
 * Base Prisma Repository
 *
 * Implements common repository operations using Prisma ORM
 */
export abstract class BasePrismaRepository<T, ID> implements BaseRepository<T, ID> {
  protected prisma: PrismaClient;
  protected readonly modelName: string;

  constructor(prisma: PrismaClient, modelName: string) {
    this.prisma = prisma;
    this.modelName = modelName;
  }

  /**
   * Get Prisma model dynamically
   */
  protected get model(): any {
    return (this.prisma as any)[this.modelName];
  }

  /**
   * Find entity by ID
   */
  async findById(id: ID): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
    });
  }

  /**
   * Find all entities matching options
   */
  async findAll(options?: Record<string, any>): Promise<T[]> {
    return this.model.findMany(options);
  }

  /**
   * Create new entity
   */
  async create(data: Partial<T>): Promise<T> {
    return this.model.create({
      data,
    });
  }

  /**
   * Update existing entity
   */
  async update(id: ID, data: Partial<T>): Promise<T> {
    return this.model.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete entity
   */
  async delete(id: ID): Promise<boolean> {
    await this.model.delete({
      where: { id },
    });
    return true;
  }

  /**
   * Count entities
   */
  async count(filter?: Record<string, any>): Promise<number> {
    return this.model.count({
      where: filter,
    });
  }

  /**
   * Execute function in transaction
   */
  async transaction<R>(fn: () => Promise<R>): Promise<R> {
    return this.prisma.$transaction(fn);
  }
}
