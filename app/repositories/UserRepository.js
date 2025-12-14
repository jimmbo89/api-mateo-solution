// app/repositories/UserRepository.js
const { Op } = require('sequelize');
const { User, Profile } = require('../models'); // Asegúrate de que el modelo se llame User
const logger = require('../../config/logger');

const UserRepository = {
  // Obtener todos los usuarios
  async findAll() {
    try {
      const users = await User.findAll({
        attributes: ['id', 'name', 'email', 'email_verified_at', 'remember_token', 'createdAt', 'updatedAt'],
      });
      return users;
    } catch (error) {
      logger.error('Error al obtener todos los usuarios:', error);
      throw new Error(`Error al obtener todos los usuarios: ${error.message}`);
    }
  },

  // Buscar un usuario por ID
  async findById(id) {
    try {
      const user = await User.findByPk(id, {
        attributes: ['id', 'name', 'email', 'email_verified_at', 'remember_token', 'external_id', 'external_auth', 'createdAt', 'updatedAt'],
      });
      return user;
    } catch (error) {
      logger.error(`Error al buscar usuario por ID ${id}:`, error);
      throw new Error(`Error al obtener todos los usuarios: ${error.message}`);
    }
  },

  // Verificar si un email ya existe (excluyendo un ID, útil para actualizaciones)
  async existsByEmail(email, excludeId = null) {
    try {
      const whereCondition = excludeId
        ? { email, id: { [Op.ne]: excludeId } }
        : { email };
      const user = await User.findOne({ where: whereCondition });
      return user;
    } catch (error) {
      logger.error(`Error al verificar existencia de email ${email}:`, error);
      throw new Error(`Error al obtener todos los usuarios: ${error.message}`);
    }
  },

  findByExternalIdAndAuth: async (externalId, provider = 'google') => {
  return await User.findOne({
    where: {
      external_id: externalId,
      external_auth: provider,
    },
    include: [{ model: Profile, as: 'profile' }]
  });
},

  // Buscar un usuario por email o por nombre (name)
async findByEmailOrName(identifier) {
  try {
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { name: identifier },
        ],
      },
      include: [
        {
          model: Profile,
          as: 'profile', // debe coincidir con el alias en la asociación
          attributes: ['id', 'user_id', 'fullName', 'avatarUrl', 'role']
        }
      ]
    });
    return user;
  } catch (error) {
    logger.error(`Error al buscar usuario por email o nombre (${identifier}):`, error);
    throw new Error(`Error al buscar usuario por email o nombre: ${error.message}`);
  }
},

  // Crear un nuevo usuario
  async create(userData, t = null) {
    try {
      const { name, email, email_verified_at, password, remember_token, external_id, external_auth } = userData;

      const user = await User.create({
        name,
        email,
        email_verified_at,
        password,
        remember_token,
        external_id,
        external_auth
      }, {t});

      return user;
    } catch (error) {
      logger.error('Error al crear usuario:', error);
      throw new Error(`Error al obtener todos los usuarios: ${error.message}`);
    }
  },

  // Actualizar un usuario
  async update(user, updateData, transaction = null) {
    try {
      const allowedFields = ['name', 'email', 'email_verified_at', 'password', 'remember_token', 'external_id', 'external_auth'];
      const filteredData = {};

      for (const key of allowedFields) {
        if (updateData[key] !== undefined) {
          filteredData[key] = updateData[key];
        }
      }

      if (Object.keys(filteredData).length === 0) {
        logger.info('No se proporcionaron campos válidos para actualizar');
        throw new Error('No se proporcionaron campos válidos para actualizar');
      }

      // Pasar la transacción a la operación de actualización
      await user.update(filteredData, { transaction });

      return user;
    } catch (error) {
      logger.error(`Error al actualizar usuario (ID: ${user.id}):`, error);
      throw new Error(`Error al actualizar usuario (ID: ${user.id}): ${error.message}`);
    }
  },

  // Eliminar un usuario (soft delete si usas paranoid, o hard delete)
  async delete(user) {
    try {
      await user.destroy();
      return { success: true, message: 'Usuario eliminado' };
    } catch (error) {
      logger.error(`Error al eliminar usuario (ID: ${user.id}):`, error);
      throw new Error(`Error al eliminar usuario (ID: ${user.id}): ${error.message}`);
    }
  },

async findByIdWithProfile(id, transaction = null) {
  return await User.findByPk(id, {
    include: [{ model: Profile, as: 'profile' }],
    transaction,
  });
}
};

module.exports = UserRepository;