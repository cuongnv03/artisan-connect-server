/**
 * Order item entity
 */
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  sellerId: string;
  quantity: number;
  price: number;
  productData: ProductSnapshot; // Snapshot of product at time of order
  createdAt: Date;
}

/**
 * Product snapshot interface
 * This is stored in the DB to preserve product info even if the product changes or is deleted
 */
export interface ProductSnapshot {
  id: string;
  name: string;
  description?: string;
  images: string[];
  attributes?: Record<string, any>;
  isCustomizable: boolean;
  customSpecifications?: string;
}

/**
 * Order item with seller details
 */
export interface OrderItemWithSeller extends OrderItem {
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    artisanProfile?: {
      shopName: string;
    } | null;
  };
}
