import Joi from 'joi';
import { OrderStatus, PaymentMethod } from '../../../domain/order/valueObjects/OrderEnums';

export const createOrderFromCartSchema = Joi.object({
  addressId: Joi.string().uuid().required(),
  paymentMethod: Joi.string()
    .valid(...Object.values(PaymentMethod))
    .required(),
  notes: Joi.string().max(500),
  appliedCouponCode: Joi.string().max(50),
});

export const createOrderFromQuoteSchema = Joi.object({
  quoteRequestId: Joi.string().uuid().required(),
  addressId: Joi.string().uuid().required(),
  paymentMethod: Joi.string()
    .valid(...Object.values(PaymentMethod))
    .required(),
  notes: Joi.string().max(500),
});

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(OrderStatus))
    .required(),
  note: Joi.string().max(500),
});

export const updateShippingInfoSchema = Joi.object({
  trackingNumber: Joi.string().max(100),
  trackingUrl: Joi.string().uri().max(500),
  estimatedDelivery: Joi.date().iso(),
}).min(1);

export const cancelOrderSchema = Joi.object({
  note: Joi.string().max(500),
});
