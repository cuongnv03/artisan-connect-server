export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  price: number; // Price at time of adding to cart
  createdAt: Date;
  updatedAt: Date;

  // Populated relations
  product?: ProductInCart;
}

export interface ProductInCart {
  id: string;
  name: string;
  slug?: string;
  price: number;
  discountPrice?: number | null;
  images: string[];
  isCustomizable: boolean;
  status: string;
  quantity: number; // Available stock
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    artisanProfile?: {
      shopName: string;
      isVerified: boolean;
    } | null;
  };
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export interface CartSummary {
  items: CartItem[];
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
  totalDiscount: number;
  total: number;
  estimatedShipping?: number;
  groupedBySeller: SellerCartGroup[];
}

export interface SellerCartGroup {
  sellerId: string;
  sellerInfo: {
    id: string;
    name: string;
    username: string;
    shopName?: string;
    isVerified: boolean;
  };
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  total: number;
}

export interface CartValidationResult {
  isValid: boolean;
  errors: CartValidationError[];
  warnings: CartValidationWarning[];
}

export interface CartValidationError {
  type: 'OUT_OF_STOCK' | 'PRODUCT_UNAVAILABLE' | 'PRICE_CHANGED' | 'INVALID_QUANTITY';
  productId: string;
  productName: string;
  message: string;
  currentQuantity: number;
  availableQuantity?: number;
  currentPrice?: number;
  cartPrice?: number;
}

export interface CartValidationWarning {
  type: 'LOW_STOCK' | 'PRICE_INCREASE' | 'PRICE_DECREASE';
  productId: string;
  productName: string;
  message: string;
  details?: any;
}

// DTOs
export interface AddToCartDto {
  productId: string;
  quantity: number;
  customizations?: Record<string, any>; // For customizable products
}

export interface UpdateCartItemDto {
  quantity: number;
  customizations?: Record<string, any>;
}

export interface BulkUpdateCartDto {
  items: Array<{
    productId: string;
    quantity: number;
    customizations?: Record<string, any>;
  }>;
}

export interface CartMergeDto {
  guestCartItems: Array<{
    productId: string;
    quantity: number;
    customizations?: Record<string, any>;
  }>;
}

export interface CartAnalytics {
  totalValue: number;
  averageItemPrice: number;
  mostExpensiveItem: CartItem;
  itemsByCategory: Record<string, number>;
  sellerDistribution: Record<string, number>;
  addedToCartDates: Date[];
}
