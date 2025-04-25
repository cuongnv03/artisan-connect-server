/**
 * Cart item entity
 */
export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;

  // Additional properties for cart view
  product?: {
    id: string;
    name: string;
    price: number;
    discountPrice?: number | null;
    images: string[];
    isCustomizable: boolean;
    stock?: number;
    seller?: {
      id: string;
      firstName: string;
      lastName: string;
      artisanProfile?: {
        shopName: string;
      } | null;
    };
  };
}

/**
 * Add to cart DTO
 */
export interface AddToCartDto {
  productId: string;
  quantity: number;
}

/**
 * Update cart item DTO
 */
export interface UpdateCartItemDto {
  quantity: number;
}

/**
 * Cart with totals
 */
export interface CartWithTotals {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  discount: number;
  total: number;
  groupedBySeller?: {
    [sellerId: string]: {
      seller: {
        id: string;
        name: string;
        shopName?: string;
      };
      items: CartItem[];
      subtotal: number;
    };
  };
}
