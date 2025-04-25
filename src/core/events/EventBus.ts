import { Logger } from '../logging/Logger';

export class EventBus {
  private static instance: EventBus;
  private listeners: Record<string, Function[]> = {};
  private logger = Logger.getInstance();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to an event
   */
  subscribe(event: string, callback: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    this.logger.debug(`Subscribed to event: ${event}`);
  }

  /**
   * Publish an event
   */
  publish(event: string, data: any): void {
    this.logger.debug(`Publishing event: ${event}`);

    if (!this.listeners[event]) {
      return;
    }

    for (const callback of this.listeners[event]) {
      try {
        callback(data);
      } catch (error) {
        this.logger.error(`Error in event listener for ${event}: ${error}`);
      }
    }
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe(event: string, callback: Function): void {
    if (!this.listeners[event]) {
      return;
    }

    this.listeners[event] = this.listeners[event].filter((listener) => listener !== callback);
  }
}
