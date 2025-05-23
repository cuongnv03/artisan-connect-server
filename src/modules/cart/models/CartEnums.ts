export enum CartItemStatus {
  ACTIVE = 'ACTIVE',
  SAVED_FOR_LATER = 'SAVED_FOR_LATER',
  EXPIRED = 'EXPIRED',
}

export enum CartCalculationType {
  SUBTOTAL = 'SUBTOTAL',
  TOTAL = 'TOTAL',
  DISCOUNT = 'DISCOUNT',
  SHIPPING = 'SHIPPING',
}

export enum CartValidationType {
  BASIC = 'BASIC', // Check product exists and in stock
  FULL = 'FULL', // Check all pricing, availability, etc.
  CHECKOUT = 'CHECKOUT', // Full validation + payment readiness
}

export enum CartActionType {
  ADD_ITEM = 'ADD_ITEM',
  UPDATE_ITEM = 'UPDATE_ITEM',
  REMOVE_ITEM = 'REMOVE_ITEM',
  CLEAR_CART = 'CLEAR_CART',
  MERGE_CART = 'MERGE_CART',
  VALIDATE_CART = 'VALIDATE_CART',
}
