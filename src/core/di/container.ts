/**
 * Dependency Injection Container
 *
 * Manages all dependencies in the application
 */
export class Container {
  private static instance: Container;
  private dependencies = new Map<string, any>();
  private factories = new Map<string, () => any>();

  private constructor() {}

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Register a dependency instance
   */
  register<T>(token: string, dependency: T): void {
    this.dependencies.set(token, dependency);
  }

  /**
   * Register a factory function to create dependency
   */
  registerFactory<T>(token: string, factory: () => T): void {
    this.factories.set(token, factory);
  }

  /**
   * Register a singleton factory (created once and cached)
   */
  registerSingleton<T>(token: string, factory: () => T): void {
    let instance: T;
    this.factories.set(token, () => {
      if (!instance) {
        instance = factory();
      }
      return instance;
    });
  }

  /**
   * Get a dependency from container
   */
  resolve<T>(token: string): T {
    // Check if it's a registered instance
    if (this.dependencies.has(token)) {
      return this.dependencies.get(token) as T;
    }

    // Check if it's a factory
    if (this.factories.has(token)) {
      const factory = this.factories.get(token)!;
      return factory() as T;
    }

    throw new Error(`Dependency ${token} not found in container`);
  }

  /**
   * Check if a dependency is registered
   */
  has(token: string): boolean {
    return this.dependencies.has(token) || this.factories.has(token);
  }

  /**
   * Clear all dependencies (useful for testing)
   */
  clear(): void {
    this.dependencies.clear();
    this.factories.clear();
  }

  /**
   * Get all registered dependency tokens
   */
  getRegisteredTokens(): string[] {
    return [...Array.from(this.dependencies.keys()), ...Array.from(this.factories.keys())];
  }
}

export default Container.getInstance();
