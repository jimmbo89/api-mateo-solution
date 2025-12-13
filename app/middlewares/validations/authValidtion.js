const Joi = require('joi');

const registerSchema = Joi.object({
    userId: Joi.number().integer().allow(null).empty("").optional(),
    name: Joi.string().min(3).required(), // nombre entre 3 y 30 caracteres
    fullName: Joi.string().min(3).optional().allow(null, '').empty('').default(null),
    role: Joi.string().min(3).optional().allow(null, '').empty('').default(null),
    email: Joi.string().email().required(),       // email válido y obligatorio
    password: Joi.string().min(5).required(),     // contraseña de al menos 6 caracteres
    email_verified_at: Joi.date().allow(null).empty('').optional(),
    remember_token: Joi.string().allow(null).empty('').optional(),
    avatarUrl: Joi.string()
      .pattern(/\.(jpg|jpeg|png|gif)$/i)  // Validar formato de imagen
      .allow(null).empty('').optional()                         // Hace que sea opcional
      .custom((value, helpers) => {
          const maxSize = 500 * 1024;     // 500 KB en bytes
          if (value && value.length > maxSize) {
              return helpers.message('El campo image debe ser una imagen válida de máximo 500 KB');
          }
          return value;
      })
      .messages({
          'string.pattern.base': 'El campo image debe ser una imagen válida (jpg, jpeg, png, gif)',
      }),
});

const loginSchema = Joi.object({
    email: Joi.string().min(3).required(), // nombre entre 3 y 30 caracteres
    password: Joi.string().min(3).required(),     // contraseña de al menos 6 caracteres
});

module.exports = {
    registerSchema,
    loginSchema,
};