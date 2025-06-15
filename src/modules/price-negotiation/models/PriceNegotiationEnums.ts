export enum NegotiationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  COUNTER_OFFERED = 'COUNTER_OFFERED',
  EXPIRED = 'EXPIRED',
}

export enum NegotiationAction {
  PROPOSE = 'PROPOSE',
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
  COUNTER = 'COUNTER',
}
