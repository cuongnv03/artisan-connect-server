export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  price: number; // Price at time of adding to cart
  createdAt: Date;
  updatedAt: Date;
  product?: ProductInCart;
  variant?: ProductVariantInCart;
}

export interface ProductInCart {
  id: string;
  name: string;
  slug?: string;
  price: number;
  discountPrice?: number;
  images: string[];
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
    };
  };
}

export interface ProductVariantInCart {
  id: string;
  sku: string;
  name?: string;
  price: number;
  discountPrice?: number;
  images: string[];
  attributes: Array<{
    key: string;
    name: string;
    value: string;
  }>;
}

export interface CartSummary {
  items: CartItem[];
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
  total: number;
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
  subtotal: number;
  total: number;
}

// DTOs
export interface AddToCartDto {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}

export interface CartValidationResult {
  isValid: boolean;
  errors: CartValidationError[];
  warnings: CartValidationWarning[];
}

export interface CartValidationError {
  type: 'OUT_OF_STOCK' | 'PRODUCT_UNAVAILABLE' | 'INVALID_QUANTITY';
  productId: string;
  productName: string;
  message: string;
}

export interface CartValidationWarning {
  type: 'LOW_STOCK' | 'PRICE_CHANGED';
  productId: string;
  productName: string;
  message: string;
}
