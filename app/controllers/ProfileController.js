// app/controllers/ProfileController.js
const { Profile, sequelize } = require("../models");
const logger = require("../../config/logger");
const { getUserId } = require("../../config/context");
const { ProfileRepository, } = require("../repositories");

const ProfileController = {
  // Obtener todos los perfiles
  async index(req, res) {
    logger.info(`${req.user?.name || 'Anonymous'} - Solicita todos los perfiles`);

    try {
      const profiles = await ProfileRepository.findAll();

      if (!profiles.length) {
        return res.status(204).json({ msg: "ProfilesNotFound" });
      }

      const mappedProfiles = profiles.map((profile) => ({
        id: profile.id,
        user_id: profile.user_id,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        role: profile.role,
        phone: profile.phone,
        cpf: profile.cpf,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      }));

      return res.status(200).json({ profiles: mappedProfiles });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error("ProfileController->index: " + errorMsg);
      return res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Obtener perfil por ID
  async show(req, res) {
    const { id } = req.params || req.body;

    if (!id) {
      return res.status(400).json({ msg: "ProfileIdRequired" });
    }

    logger.info(`${req.user?.name || 'Anonymous'} - Solicita perfil con ID ${id}`);

    try {
      const profile = await ProfileRepository.findById(id);

      if (!profile) {
        return res.status(404).json({ msg: "ProfileNotFound" });
      }

      const mappedProfile = {
        id: profile.id,
        user_id: profile.user_id,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        role: profile.role,
        phone: profile.phone,
        cpf: profile.cpf,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      };

      return res.status(200).json({ profile: mappedProfile });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error(`ProfileController->show (ID: ${id}): ${errorMsg}`);
      return res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Crear un nuevo perfil
  async store(req, res) {
    logger.info(`${req.user?.name || 'Anonymous'} - Crea un nuevo perfil`);
    logger.info("Datos recibidos:");
    logger.info(JSON.stringify(req.body));

    const { user_id: bodyuser_id, fullName, role, phone, cpf } = req.body;
    const user_id = bodyuser_id || req.user?.id;
    req.body.user_id = user_id;

    const uniqueCheck = await ProfileRepository.checkUniqueFields({ phone, cpf });
    if (uniqueCheck.exists) {
      const fieldLabel = uniqueCheck.field === 'phone' ? 'número de teléfono' : 'CPF';
      return res.status(400).json({ 
        error: "ValidationError", 
        details: `El ${fieldLabel} ya está en uso` 
      });
    }

    const t = await sequelize.transaction();
    try {
      const profile = await ProfileRepository.create(req.body, req.file, t);
      await t.commit();

      const mappedProfile = {
        id: profile.id,
        user_id: profile.user_id,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        role: profile.role,
        phone: profile.phone,
        cpf: profile.cpf,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      };

      return res.status(201).json({ profile: mappedProfile });
    } catch (error) {
      await t.rollback();
      const errorMsg = error.message || "Error desconocido";
      logger.error("ProfileController->store: " + errorMsg);
      return res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Actualizar un perfil
  async update(req, res) {
    const { id } = req.params || req.body;
    logger.info(`${req.user?.name || 'Anonymous'} - Actualiza perfil con ID ${id}`);
    logger.info("Datos recibidos:");
    logger.info(JSON.stringify(req.body));

     const { phone, cpf } = req.body;

    // ✅ Verificar unicidad, excluyendo el perfil actual
    const uniqueCheck = await ProfileRepository.checkUniqueFields({ phone, cpf }, id);
    if (uniqueCheck.exists) {
      const fieldLabel = uniqueCheck.field === 'phone' ? 'número de teléfono' : 'CPF';
      return res.status(400).json({ 
        error: "ValidationError", 
        details: `El ${fieldLabel} ya está en uso` 
      });
    }

    try {
      const profile = await ProfileRepository.findById(id);

      if (!profile) {
        return res.status(404).json({ msg: "ProfileNotFound" });
      }

      const t = await sequelize.transaction();
      try {
        const updatedProfile = await ProfileRepository.update(profile, req.body, req.file, t);
        await t.commit();

        const mappedProfile = {
          id: updatedProfile.id,
          user_id: updatedProfile.user_id,
          fullName: updatedProfile.fullName,
          avatarUrl: updatedProfile.avatarUrl,
          role: updatedProfile.role,
          phone: updatedProfile.phone,
          cpf: updatedProfile.cpf,
          createdAt: updatedProfile.createdAt,
          updatedAt: updatedProfile.updatedAt,
        };

        return res.status(200).json({ profile: mappedProfile });
      } catch (error) {
        await t.rollback();
        throw error;
      }
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error(`ProfileController->update (ID: ${id}): ${errorMsg}`);
      return res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Eliminar un perfil
  async destroy(req, res) {
    const { id } = req.params || req.body;
    logger.info(`${req.user?.name || 'Anonymous'} - Elimina perfil con ID ${id}`);

    try {
      const profile = await ProfileRepository.findById(id);

      if (!profile) {
        return res.status(404).json({ msg: "ProfileNotFound" });
      }

      await ProfileRepository.delete(profile);

      return res.status(200).json({ msg: "ProfileDeleted" });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error(`ProfileController->destroy (ID: ${id}): ${errorMsg}`);
      return res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },

  // Obtener perfil por user_id (útil para autenticación)
  async getByUserId(req, res) {
    const {  user_id: bodyuser_id } = req.params || req.body;
    const user_id = bodyuser_id || getUserId();
    logger.info(`${req.user?.name || 'Anonymous'} - Busca perfil por user_id ${user_id}`);

    try {
      const profile = await ProfileRepository.findByUserId(user_id);

      if (!profile) {
        return res.status(404).json({ msg: "ProfileNotFound" });
      }

      const mappedProfile = {
        id: profile.id,
        user_id: profile.user_id,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        role: profile.role,
        phone: profile.phone,
        cpf: profile.cpf,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      };

      return res.status(200).json({ profile: mappedProfile });
    } catch (error) {
      const errorMsg = error.message || "Error desconocido";
      logger.error(`ProfileController->getByuser_id (user_id: ${user_id}): ${errorMsg}`);
      return res.status(500).json({ error: "ServerError", details: errorMsg });
    }
  },
};

module.exports = ProfileController;