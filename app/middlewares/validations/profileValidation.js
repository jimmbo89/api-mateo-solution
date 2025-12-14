// app/validations/profileValidation.js
const Joi = require('joi');

// Esquema para crear o actualizar un perfil
const profileSchema = Joi.object({
  user_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'El campo user_id es obligatorio',
      'number.base': 'user_id debe ser un número entero',
      'number.positive': 'user_id debe ser un número positivo'
    }),

  fullName: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .allow(null, '')
    .empty('')
    .default(null)
    .messages({
      'string.min': 'fullName debe tener al menos 2 caracteres',
      'string.max': 'fullName no puede exceder los 100 caracteres'
    }),
    phone: Joi.string()
    .min(7)
    .max(20)
    .pattern(/^[\d\s\-\+\(\)]+$/)
    .optional()
    .allow(null, '')
    .empty('')
    .default(null)
    .messages({
      'string.min': 'phone debe tener al menos 7 caracteres',
      'string.max': 'phone no puede exceder los 20 caracteres',
      'string.pattern.base': 'phone solo puede contener números, espacios, guiones, paréntesis y el símbolo +'
    }),

  role: Joi.string()
    .valid('user', 'admin', 'seller', 'moderator') // ajusta según tus roles reales
    .optional()
    .allow(null, '')
    .empty('')
    .default('user')
    .messages({
      'any.only': 'role debe ser uno de los siguientes: user, admin, seller, moderator'
    }),

    cpf: Joi.string()
    .optional()
    .allow(null, '')
    .empty('')
    .default(null)
  // NOTA: avatarUrl NO se valida aquí porque:
  // - En el body NO viene como string, sino como archivo (req.file)
  // - La URL final se genera después de subir el archivo
  // - La validación de imagen se hace en ImageService
});

// Esquema para actualización parcial (user_id no es editable)
const profileUpdateSchema = Joi.object({
  user_id: Joi.number()
    .integer()
    .positive()
    .optional() // permitido, pero no recomendado cambiarlo
    .messages({
      'number.base': 'user_id debe ser un número entero',
      'number.positive': 'user_id debe ser un número positivo'
    }),

  fullName: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .allow(null, '')
    .empty('')
    .messages({
      'string.min': 'fullName debe tener al menos 2 caracteres',
      'string.max': 'fullName no puede exceder los 100 caracteres'
    }),

    cpf: Joi.string()
    .optional()
    .allow(null, '')
    .empty('')
    .default(null),

    phone: Joi.string()
    .min(7)
    .max(20)
    .pattern(/^[\d\s\-\+\(\)]+$/)
    .optional()
    .allow(null, '')
    .empty('')
    .default(null)
    .messages({
      'string.min': 'phone debe tener al menos 7 caracteres',
      'string.max': 'phone no puede exceder los 20 caracteres',
      'string.pattern.base': 'phone solo puede contener números, espacios, guiones, paréntesis y el símbolo +'
    }),

  role: Joi.string()
    .valid('user', 'admin', 'invitado')
    .optional()
    .allow(null, '')
    .empty('')
    .messages({
      'any.only': 'role debe ser uno de los siguientes: user, admin, seller, moderator'
    }),
})
  .or('user_id', 'fullName', 'role') // al menos uno de estos campos debe estar presente
  .messages({
    'object.missing': 'Debe proporcionar al menos un campo para actualizar: user_id, fullName o role'
  });

  const idProfileSchema = Joi.object({
  id: Joi.number().optional(),
});

module.exports = {
  profileSchema,
  profileUpdateSchema,
  idProfileSchema
};