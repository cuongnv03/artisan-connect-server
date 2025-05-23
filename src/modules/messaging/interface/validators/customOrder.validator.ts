import Joi from 'joi';

// Base schemas
const proposalSchema = Joi.object({
  productName: Joi.string().required().min(3).max(200),
  description: Joi.string().required().min(10).max(2000),
  estimatedPrice: Joi.number().positive().max(50000).required(),
  estimatedDuration: Joi.string().required().min(3).max(100),
  specifications: Joi.object().default({}),
  images: Joi.array().items(Joi.string().uri()).max(10),
  deadline: Joi.date().iso().min('now'),
  materials: Joi.array().items(Joi.string().max(50)).max(20),
  dimensions: Joi.string().max(200),
  colorPreferences: Joi.array().items(Joi.string().max(30)).max(10),
  attachments: Joi.array().items(Joi.string().uri()).max(5),
});

const responseSchema = Joi.object({
  accepted: Joi.boolean().required(),
  message: Joi.string().required().min(1).max(2000),
  counterOffer: Joi.object({
    price: Joi.number().positive().max(50000).required(),
    duration: Joi.string().required().min(3).max(100),
    modifications: Joi.string().required().min(10).max(1000),
    conditions: Joi.array().items(Joi.string().max(200)).max(10),
  }).when('accepted', {
    is: false,
    then: Joi.optional(),
    otherwise: Joi.forbidden(),
  }),
  canProceed: Joi.boolean().default(false),
  requiresMoreInfo: Joi.boolean().default(false),
  additionalQuestions: Joi.array().items(Joi.string().max(500)).max(10),
});

// Unified custom order schema
export const sendCustomOrderSchema = Joi.object({
  type: Joi.string().valid('proposal', 'response', 'simple_message').required(),

  // For proposal type
  artisanId: Joi.string().uuid().when('type', {
    is: 'proposal',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  proposal: proposalSchema.when('type', {
    is: 'proposal',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),

  // For response type
  customerId: Joi.string().uuid().when('type', {
    is: 'response',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  originalMessageId: Joi.string().uuid().when('type', {
    is: 'response',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  response: responseSchema.when('type', {
    is: 'response',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),

  // For simple message type (legacy)
  receiverId: Joi.string().uuid().when('type', {
    is: 'simple_message',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  content: Joi.string().min(1).max(2000).when('type', {
    is: 'simple_message',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
  orderData: Joi.object({
    productName: Joi.string().required().max(200),
    description: Joi.string().max(2000),
    estimatedPrice: Joi.number().positive(),
    estimatedDuration: Joi.string().max(100),
    specifications: Joi.object(),
  }).when('type', {
    is: 'simple_message',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
});

// Separate schemas for other endpoints
export const updateCustomOrderProposalSchema = Joi.object({
  updates: Joi.object({
    productName: Joi.string().min(3).max(200),
    description: Joi.string().min(10).max(2000),
    estimatedPrice: Joi.number().positive().max(50000),
    estimatedDuration: Joi.string().min(3).max(100),
    specifications: Joi.object(),
    images: Joi.array().items(Joi.string().uri()).max(10),
    deadline: Joi.date().iso().min('now'),
    materials: Joi.array().items(Joi.string().max(50)).max(20),
    dimensions: Joi.string().max(200),
    colorPreferences: Joi.array().items(Joi.string().max(30)).max(10),
    attachments: Joi.array().items(Joi.string().uri()).max(5),
  })
    .min(1)
    .required(),
});

export const cancelNegotiationSchema = Joi.object({
  reason: Joi.string().max(500).allow(''),
});
