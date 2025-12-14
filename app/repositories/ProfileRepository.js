// app/repositories/ProfileRepository.js
const { Op } = require('sequelize');
const { Profile } = require('../models');
const ImageService = require('../services/ImageService'); // Asegúrate de que exista
const logger = require('../../config/logger');

const DEFAULT_AVATAR = 'avatars/default.jpg';

const ProfileRepository = {
  // Obtener todos los perfiles
  async findAll() {
    try {
      const profiles = await Profile.findAll({
        attributes: ['id', 'user_id', 'fullName', 'avatarUrl', 'role', "phone", "cpf", 'createdAt', 'updatedAt']
      });
      return profiles;
    } catch (error) {
      logger.error('Error al obtener todos los perfiles:', error);
      throw new Error(`Error al obtener todos los perfiles: ${error.message}`);
    }
  },

  // Buscar un perfil por ID
  async findById(id) {
    try {
      const profile = await Profile.findByPk(id, {
        attributes: ['id', 'user_id', 'fullName', 'avatarUrl', 'role', "phone", "cpf", 'createdAt', 'updatedAt']
      });
      return profile;
    } catch (error) {
      logger.error(`Error al buscar perfil por ID ${id}:`, error);
      throw new Error(`Error al buscar perfil por ID ${id}: ${error.message}`);
    }
  },

  // Buscar un perfil por user_id
  async findByUserId(user_id) {
    try {
      const profile = await Profile.findOne({
        where: { user_id },
        attributes: ['id', 'user_id', 'fullName', 'avatarUrl', 'role', "phone", "cpf", 'createdAt', 'updatedAt']
      });
      return profile;
    } catch (error) {
      logger.error(`Error al buscar perfil por user_id ${user_id}:`, error);
      throw new Error(`Error al buscar perfil por user_id ${user_id}: ${error.message}`);
    }
  },

  // Verificar si ya existe un perfil para un user_id dado
  async existsByuser_id(user_id) {
    try {
      const profile = await Profile.findOne({ where: { user_id } });
      return !!profile;
    } catch (error) {
      logger.error(`Error al verificar existencia de perfil para user_id ${user_id}:`, error);
      throw new Error(`Error al verificar existencia de perfil: ${error.message}`);
    }
  },

  // Crear un nuevo perfil (con soporte para imagen y transacción)
  async create(body, file, t) {
    const { user_id, fullName, role = 'user', phone, cpf } = body;

    try {
      // Crear perfil con imagen por defecto
      const profile = await Profile.create(
        {
          user_id,
          fullName,
          avatarUrl: DEFAULT_AVATAR,
          role,
          phone,
          cpf
        },
        { transaction: t }
      );

      // Manejar archivo si se proporciona
      if (file) {
        const newFilename = ImageService.generateFilename(
          'avatars',
          profile.id,
          file.originalname
        );
        profile.avatarUrl = await ImageService.moveFile(file, newFilename);
        await profile.update({ avatarUrl: profile.avatarUrl }, { transaction: t });
      }

      return profile;
    } catch (error) {
      logger.error('Error al crear perfil:', error);
      throw new Error(`Error al crear perfil: ${error.message}`);
    }
  },

  // Actualizar un perfil (con manejo de imagen y transacción)
  async update(profile, body, file, t) {
    const fieldsToUpdate = ['user_id', 'fullName', 'role', 'phone', 'cpf', 'avatarUrl'];

    const updatedData = Object.keys(body)
      .filter((key) => fieldsToUpdate.includes(key) && body[key] !== undefined)
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {});

    try {
      // Manejar el archivo si se proporciona
      if (file) {
        // Eliminar imagen anterior si no es la predeterminada
        if (profile.avatarUrl && profile.avatarUrl !== DEFAULT_AVATAR) {
          await ImageService.deleteFile(profile.avatarUrl);
        }
        // Subir nueva imagen
        const newFilename = ImageService.generateFilename(
          'avatarUrl',
          profile.id,
          file.originalname
        );
        updatedData.avatarUrl = await ImageService.moveFile(file, newFilename);
      }

      // Actualizar en la base de datos si hay cambios
      if (Object.keys(updatedData).length > 0) {
        await profile.update(updatedData, { transaction: t });
        logger.info(`Perfil actualizado exitosamente (ID: ${profile.id})`);
      }

      return profile;
    } catch (error) {
      logger.error(`Error en ProfileRepository->update: ${error.message}`);
      throw error; // Propagar para rollback
    }
  },

  // Eliminar un perfil (con limpieza de imagen)
  async delete(profile) {
    try {
      // Eliminar imagen si no es la predeterminada
      if (profile.avatarUrl && profile.avatarUrl !== DEFAULT_AVATAR) {
        await ImageService.deleteFile(profile.avatarUrl);
      }

      return await profile.destroy();
    } catch (error) {
      logger.error(`Error al eliminar perfil (ID: ${profile.id}):`, error);
      throw new Error(`Error al eliminar perfil (ID: ${profile.id}): ${error.message}`);
    }
  },
  async checkUniqueFields(data, excludeId = null) {
    const { phone, cpf } = data;

    // Si ambos son null/undefined, no hay nada que verificar
    if ((phone === null || phone === undefined || phone === '') &&
        (cpf === null || cpf === undefined || cpf === '')) {
      return { exists: false, field: null };
    }

    let whereCondition = {};

    // Solo incluir phone si no es nulo/vacío
    if (phone !== null && phone !== undefined && phone !== '') {
      whereCondition.phone = phone;
    }

    // Solo incluir cpf si no es nulo/vacío
    if (cpf !== null && cpf !== undefined && cpf !== '') {
      whereCondition.cpf = cpf;
    }

    // Si no hay condiciones, no hay duplicados posibles
    if (Object.keys(whereCondition).length === 0) {
      return { exists: false, field: null };
    }

    // Si es edición, excluir el registro actual
    if (excludeId !== null) {
      whereCondition.id = { [Op.ne]: excludeId };
    }

    // Buscar si existe algún perfil que coincida
    const existing = await Profile.findOne({
      where: whereCondition,
      attributes: ['id', 'phone', 'cpf']
    });

    if (existing) {
      // Determinar qué campo causó el conflicto
      if (phone !== null && phone !== undefined && phone !== '' && existing.phone === phone) {
        return { exists: true, field: 'phone' };
      }
      if (cpf !== null && cpf !== undefined && cpf !== '' && existing.cpf === cpf) {
        return { exists: true, field: 'cpf' };
      }
    }

    return { exists: false, field: null };
  }
};

module.exports = ProfileRepository;