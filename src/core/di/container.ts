/**
 * Dependency Injection Container
 *
 * Quản lý tất cả dependencies trong ứng dụng
 */

export class Container {
  private static instance: Container;
  private dependencies = new Map<string, any>();

  private constructor() {}

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Đăng ký một dependency
   */
  register<T>(token: string, dependency: T): void {
    this.dependencies.set(token, dependency);
  }

  /**
   * Đăng ký một factory function để tạo dependency
   */
  registerFactory<T>(token: string, factory: () => T): void {
    this.dependencies.set(token, factory);
  }

  /**
   * Lấy một dependency từ container
   */
  resolve<T>(token: string): T {
    const dependency = this.dependencies.get(token);

    if (!dependency) {
      throw new Error(`Dependency ${token} not found in container`);
    }

    // Nếu là factory function thì thực thi để lấy instance
    if (typeof dependency === 'function' && !Object.getPrototypeOf(dependency).name) {
      return dependency();
    }

    return dependency as T;
  }
}

export default Container.getInstance();
