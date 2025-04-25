import { OrderStatus } from './OrderEnums';

/**
 * Order status history entity
 */
export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  note?: string | null;
  createdBy?: string | null; // User ID who changed the status
  createdAt: Date;
}
