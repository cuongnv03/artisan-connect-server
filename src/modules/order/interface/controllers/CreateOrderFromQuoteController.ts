import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../../../shared/baseClasses/BaseController';
import { ApiResponse } from '../../../../shared/utils/ApiResponse';
import { IOrderService } from '../../services/OrderService.interface';
import { AppError } from '../../../../core/errors/AppError';
import { Logger } from '../../../../core/logging/Logger';
import container from '../../../../core/di/container';

export class CreateOrderFromQuoteController extends BaseController {
  private orderService: IOrderService;
  private logger = Logger.getInstance();

  constructor() {
    super();
    this.orderService = container.resolve<IOrderService>('orderService');
  }

  protected async executeImpl(req: Request, res: Response, next: NextFunction): Promise<void> {
    this.validateAuth(req);

    const startTime = Date.now();
    const { quoteRequestId } = req.body;

    try {
      this.logger.info(`Creating order from quote ${quoteRequestId} for user ${req.user!.id}`);

      const order = await this.orderService.createOrderFromQuote(req.user!.id, req.body);

      // ✅ CRITICAL: Validate order creation success
      if (!order || !order.id) {
        this.logger.error(`Order service returned invalid order data: ${JSON.stringify(order)}`);
        throw AppError.internal(
          'Order creation failed - invalid response',
          'INVALID_ORDER_RESPONSE',
        );
      }

      const duration = Date.now() - startTime;
      this.logger.info(
        `Order created successfully: ${order.id} (${order.orderNumber}) in ${duration}ms`,
      );

      ApiResponse.created(res, order, 'Order created successfully from quote');
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Enhanced error logging
      this.logger.error(
        `Order creation failed after ${duration}ms - userId: ${req.user!.id}, quoteRequestId: ${quoteRequestId}, error: ${error.message}, stack: ${error.stack}`,
      );

      // Check if it's a validation error vs system error
      if (error instanceof AppError) {
        if (error.statusCode >= 400 && error.statusCode < 500) {
          // Client error - return as is
          throw error;
        }
      }

      // For 500 errors, check if order might have been created anyway
      if (quoteRequestId) {
        try {
          // Check if the quote status changed to COMPLETED
          // This would indicate the order was actually created
          const quoteCheck = await this.checkQuoteStatus(quoteRequestId);
          if (quoteCheck?.status === 'COMPLETED') {
            this.logger.warn(
              `Order may have been created despite error - quote ${quoteRequestId} is COMPLETED`,
            );

            // Return a different error message
            throw AppError.internal(
              'Order creation status unclear - please check your orders page',
              'ORDER_STATUS_UNCLEAR',
            );
          }
        } catch (checkError) {
          this.logger.error(`Failed to check quote status: ${checkError}`);
        }
      }

      // Generic internal error
      throw AppError.internal('Failed to create order from quote', 'ORDER_CREATION_FAILED');
    }
  }

  // ✅ Helper method to check quote status
  private async checkQuoteStatus(quoteId: string): Promise<{ status: string } | null> {
    try {
      // This would need to be implemented to check quote status
      // For now, just return null
      return null;
    } catch (error) {
      this.logger.error(`Error checking quote status: ${error}`);
      return null;
    }
  }
}
