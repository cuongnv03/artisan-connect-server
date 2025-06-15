import Joi from 'joi';

export const sendCustomOrderMessageSchema = Joi.object({
  type: Joi.string()
    .valid('create_custom_order', 'respond_custom_order', 'quote_discussion')
    .required(),

  receiverId: Joi.string().uuid().required(),
  content: Joi.string().required().min(1).max(2000),

  // For create_custom_order
  customOrderData: Joi.object({
    title: Joi.string().min(5).max(200),
    description: Joi.string().min(10).max(2000),
    estimatedPrice: Joi.number().positive(),
    customerBudget: Joi.number().positive(),
    timeline: Joi.string().max(500),
    specifications: Joi.object(),
    attachments: Joi.array().items(Joi.string().uri()),
    referenceProductId: Joi.string().uuid(),
  }).when('type', {
    is: 'create_custom_order',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),

  // For respond_custom_order & quote_discussion
  quoteRequestId: Joi.string()
    .uuid()
    .when('type', {
      is: Joi.valid('respond_custom_order', 'quote_discussion'),
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),

  // For respond_custom_order
  response: Joi.object({
    action: Joi.string().valid('ACCEPT', 'REJECT', 'COUNTER_OFFER').required(),
    finalPrice: Joi.number().positive().when('action', {
      is: 'COUNTER_OFFER',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    data: Joi.object(),
  }).when('type', {
    is: 'respond_custom_order',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
});
