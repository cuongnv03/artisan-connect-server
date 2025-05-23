export enum QuoteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COUNTER_OFFERED = 'COUNTER_OFFERED',
  EXPIRED = 'EXPIRED',
  COMPLETED = 'COMPLETED', // When converted to order
}

export enum QuoteAction {
  REQUEST = 'REQUEST',
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
  COUNTER = 'COUNTER',
  MESSAGE = 'MESSAGE',
}
