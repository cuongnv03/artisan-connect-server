/**
 * Generic Repository Interface
 *
 * Defines standard operations to be performed on domain entities
 */
export interface BaseRepository<T, ID> {
  findById(id: ID): Promise<T | null>;
  findAll(options?: Record<string, any>): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: ID, data: Partial<T>): Promise<T>;
  delete(id: ID): Promise<boolean>;
  count(filter?: Record<string, any>): Promise<number>;
  transaction<R>(fn: () => Promise<R>): Promise<R>;
}
