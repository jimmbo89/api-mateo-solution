const Joi = require('joi');

// Esquema base: campos editables (sin identificadores)
const editableConsentFields = {
  email: Joi.string().email().optional().allow(null, '').default(null),
  accepted_terms: Joi.boolean().optional(),
  accepted_at: Joi.date().iso().optional().allow(null),
  user_agent: Joi.string().max(1000).optional().allow(null, '').default(null),
  language: Joi.string().max(10).optional().allow(null, '').default(null),
  timezone: Joi.string().max(50).optional().allow(null, '').default(null),
  screen_resolution: Joi.string().max(20).optional().allow(null, '').default(null),
  platform: Joi.string().max(50).optional().allow(null, '').default(null),
  device_type: Joi.string().valid('desktop', 'mobile', 'tablet').optional().allow(null, '').default(null),
  page_url: Joi.string().uri().optional().allow(null, '').default(null),
  referrer: Joi.string().uri().optional().allow(null, '').default(null),
  terms_version: Joi.string().max(20).optional().allow(null, '').default(null),
  stripe_customer_id: Joi.string().max(100).optional().allow(null, '').default(null),
  stripe_subscription_id: Joi.string().max(100).optional().allow(null, '').default(null),
  plan: Joi.string().max(50).optional().allow(null, '').default(null),
  finalized_at: Joi.date().iso().optional().allow(null)
};

const IDENTIFIER_FIELDS = ['id', 'email', 'stripe_customer_id', 'stripe_subscription_id'];

const identifierSchema = Joi.object()
  .pattern(
    Joi.string().valid(...IDENTIFIER_FIELDS),
    [Joi.number().integer().positive(), Joi.string().max(200)]
  )
  .length(1) // exactamente un campo
  .required()
  .messages({
    'object.base': 'Debe enviar un identificador válido',
    'object.length': 'Debe proporcionar exactamente un identificador: id, email, stripe_customer_id o stripe_subscription_id'
  });

// Usar en update y destroy
const consentUpdateSchema = Joi.object({
  // Campos editables (todos opcionales)
  ...editableConsentFields,

  // Identificadores: opcionales, pero al menos uno y solo uno
  id: Joi.number().integer().positive().optional(),
  email: Joi.string().email().optional(),
  stripe_customer_id: Joi.string().max(100).optional(),
  stripe_subscription_id: Joi.string().max(100).optional()
})
  .xor(...IDENTIFIER_FIELDS) // debe haber exactamente uno de estos
  .messages({
    'object.xor': 'Debe proporcionar exactamente uno de los siguientes identificadores: id, email, stripe_customer_id o stripe_subscription_id'
  });
const consentIdentifierSchema = identifierSchema;

// Esquema para crear
const consentCreateSchema = Joi.object(editableConsentFields);

module.exports = {
  consentCreateSchema,
  consentUpdateSchema,
  consentIdentifierSchema // usado en destroy y show
};