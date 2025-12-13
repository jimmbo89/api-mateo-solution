const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authConfig = require("../../config/auth");
const { sequelize } = require("../models")
const logger = require("../../config/logger");
const passport = require("passport");
const fs = require("fs");
const promisefs = require('fs').promises;
const path = require("path");
const axios = require("axios");
const { pipeline } = require("stream/promises");
const moment = require("moment"); // Usamos mom
const { UserRepository, UserTokenRepository, ProfileRepository, StoreRepository, ProductRepository, CategoryRepository, UserStoreRepository } = require("../repositories");

const AuthController = {

    async signIn(req, res) {
        logger.info("Entrando a loguearse");
        logger.info("datos recibidos al loguerase");
        logger.info(JSON.stringify(req.body));

        try {
        const user = await UserRepository.findByEmailOrName(req.body.email);

        if (!user) {
        return res.status(204).json({ msg: "Usuario no encontrado" });
        }
        // Verificar si el campo password es nulo o vacío
        if (!user.password || user.password === "") {
            return res.status(400).json({ msg: "Credenciales inválidas1" });
        }

        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Credenciales inválidas2" });
        }

        let origin = req.get('Origin');
        if (!origin) {
        const host = req.get('Host');
        const protocol = req.protocol;
        origin = `${protocol}://${host.split(':')[0]}`;
        }
         const userNew = {
            id: user.id,
            email: user.email,
            name: user.name,
            profile: {
                id: user.profile.id,
                fullName: user.profile.fullName,
                avatarUrl: user.profile.avatarUrl,
                role: user.profile.role
            }
        };

        // Creamos el token
        const token = jwt.sign({ user: userNew }, authConfig.secret, {
            expiresIn: authConfig.expires,
        });

        // Decodificar el token para obtener la fecha de expiración
        const decoded = jwt.decode(token);

        // La fecha de expiración está en el campo 'exp' del JWT
        const expiresAt = new Date(decoded.exp * 1000); // 'exp' es en segundos, así que lo convertimos a milisegundos

        const userTokenData = {
            user_id: user.id,
            token: token,
            expires_at: expiresAt,
        };

        const usertoken = await UserTokenRepository.create(userTokenData);

        res.status(201).json({
            id: userNew.id,
            userName: userNew.name,
            email: userNew.email,
            token: token,
            profileId: userNew.profile.id,
            fullName: userNew.profile.fullName,
            role: userNew.profile.role,
            avatarUrl: userNew.profile.avatarUrl,

        });
        } catch (error) {
        const errorMsg = error.details
            ? error.details.map((detail) => detail.message).join(", ")
            : error.message || "Error desconocido";

        logger.error("Error al loguear usuario: " + errorMsg);
        return res.status(500).json({ error: "ServerError", details: errorMsg });
        }
    },

    async signUp(req, res) {
        logger.info("Registrando Usuario.");
        logger.info("datos recibidos al registrarse");
        logger.info(JSON.stringify(req.body));
        const t = await sequelize.transaction(); // Inicia una transacción
        try {
        // Generar un hashSync de la contraseña
        let hashedPassword = bcrypt.hashSync(
            req.body.password,
            Number.parseInt(authConfig.rounds)
        );
        const extractedName = req.body.name
            ? req.body.name
            : req.body.email.split("@")[0];
        // Crear el usuario con la contraseña encriptada
        
        const userData = {
            name: extractedName,
            email: req.body.email,
            password: hashedPassword, // ✅ ya hasheada
            email_verified_at: null, // o Date.now() si se verifica inmediatamente
            remember_token: null,    // o genera uno si lo usas
        };

        // 5. Llamar al repositorio
        const user = await UserRepository.create(userData);

        const profileData = {
            userId: user.id,
            fullName: req.body.fullName,
            role: req.body.role,
        };

        const profile = await ProfileRepository.create(profileData, req.file, t);
        // Creamos el objeto con la información del usuario y la persona
        const userNew = {
            id: user.id,
            email: user.email,
            name: user.name,
            profile: {
                id: profile.id, // Aquí accedes a la profilea creada
                fullName: profile.fullName,
                avatarUrl: profile.avatarUrl,
                role: profile.role
            },
        };

        let origin = req.get('Origin');
        if (!origin) {
        const host = req.get('Host');
        const protocol = req.protocol;
        origin = `${protocol}://${host.split(':')[0]}`;
        }

        logger.info(`register desde dominio: ${origin}`);

        // 2. Buscar store con ese dominio (lectura → no necesita transacción)
        const store = await StoreRepository.findByDomain(origin);

        // 3. Asociar usuario al store
        await UserStoreRepository.associateUserToStore(
        userNew.id,
        store.id,
        userNew.profile.role
        ); 
        // Creamos el token
        const token = jwt.sign({ user: userNew }, authConfig.secret, {
            expiresIn: authConfig.expires,
        });

        // Decodificar el token para obtener la fecha de expiración
        const decoded = jwt.decode(token);

        // La fecha de expiración está en el campo 'exp' del JWT
        const expiresAt = new Date(decoded.exp * 1000); // 'exp' es en segundos, así que lo convertimos a milisegundos

        const userTokenData = {
            user_id: user.id,
            token: token,
            expires_at: expiresAt,
        };

        const usertoken = await UserTokenRepository.create(userTokenData);
        // Hacer commit de la transacción
        await t.commit();
        // Respuesta en formato JSON
        res.status(201).json({
            id: userNew.id,
            userName: userNew.name,
            email: userNew.email,
            token: token,
            store_id: store?.id || null,
            profileId: userNew.profile.id,
            fullName: userNew.profile.fullName,
            role: userNew.profile.role,
            avatarUrl: userNew.profile.avatarUrl,
        });
        } catch (error) {
        // Revertir la transacción en caso de error
        await t.rollback();
        const errorMsg = error.details
            ? error.details.map((detail) => detail.message).join(", ")
            : error.message || "Error desconocido";

        logger.error("Error al registrar usuario: " + errorMsg);
        return res.status(500).json({ error: "ServerError", details: errorMsg });
        }
    },

    async signInByDomain(req, res) {
    const t = await sequelize.transaction();

    try {
        // 1. Obtener dominio desde la solicitud
        let origin = req.get('Origin');
        if (!origin) {
        const host = req.get('Host');
        const protocol = req.protocol;
        origin = `${protocol}://${host.split(':')[0]}`;
        }

        logger.info(`Intento de login por dominio desde: ${origin}`);

        // 2. Buscar store con ese dominio (lectura → no necesita transacción)
        const store = await StoreRepository.findByDomain(origin);
        if (!store) {
        await t.rollback();
        return res.status(400).json({ error: "Dominio no autorizado" });
        }

        const domain = origin;

        // 3. Buscar usuario por nombre (dominio)
        const existingUser = await UserRepository.findByEmailOrName(domain);
        let user;

        if (existingUser) {
        const isMatch = await bcrypt.compare(domain, existingUser.password);
        if (!isMatch) {
            await t.rollback();
            return res.status(500).json({ error: "Error interno: credenciales corruptas" });
        }

        logger.info(`Usuario existente encontrado para dominio: ${domain}`);
        user = existingUser;

        // ✅ Asegurar que el usuario tenga perfil
        let userWithProfile = await UserRepository.findByIdWithProfile(user.id, t);
        if (!userWithProfile?.profile) {
            // Crear perfil para usuario existente (dentro de la transacción)
            const profileData = {
            userId: user.id,
            fullName: store.name || 'Invitado',
            role: 'invitado',
            };
            await ProfileRepository.create(profileData, null, t);
            // Volver a cargar con perfil (usando la transacción)
            userWithProfile = await UserRepository.findByIdWithProfile(user.id, t);
        }

        user = userWithProfile; // usar el usuario con perfil
        } else {
        // 4. Crear usuario invitado
        logger.info(`Creando usuario invitado para dominio: ${domain}`);
        const hashedPassword = bcrypt.hashSync(domain, parseInt(authConfig.rounds));

        const userData = {
            name: domain,
            email: null,
            password: hashedPassword,
            email_verified_at: null,
            remember_token: null,
        };

        user = await UserRepository.create(userData, null, t);

        // Crear perfil
        const profileData = {
            userId: user.id,
            fullName: store.name || 'Invitado',
            role: 'invitado',
        };

        await ProfileRepository.create(profileData, null, t);

        // Cargar usuario con perfil (usando transacción)
        user = await UserRepository.findByIdWithProfile(user.id, t);
        }

        // 5. Validar que ahora sí tenga perfil
        if (!user?.profile) {
        await t.rollback();
        return res.status(500).json({ error: "No se pudo asociar un perfil al usuario" });
        }

        // 6. Generar token
        const userPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        profile: {
            id: user.profile.id,
            fullName: user.profile.fullName,
            avatarUrl: user.profile.avatarUrl,
            role: user.profile.role,
        }
        };

        const token = jwt.sign({ user: userPayload }, authConfig.secret, {
        expiresIn: authConfig.expires,
        });

        const decoded = jwt.decode(token);
        const expiresAt = new Date(decoded.exp * 1000);

        await UserTokenRepository.create(
        {
            user_id: user.id,
            token: token,
            expires_at: expiresAt,
        },
        null,
        t
        );

        // 7. Confirmar transacción
        await t.commit();
        let products = null;
        let categories = null;
        let updatedStore = store; // valor por defecto

        if (store.id) {
        products = await ProductRepository.getProductsByStorePaginated(store.id, {}, 15, null, user.id);
        categories = await CategoryRepository.findByStoreId(store.id);
        
        const currentVisits = store.visits || 0;
        await StoreRepository.incrementVisits(store.id);
        const updatedVisits = currentVisits + 1;

        // ✅ Asignamos el store actualizado a una variable
        updatedStore = {
            ...store.toJSON ? store.toJSON() : store,
            visits: updatedVisits
        };
        }

        return res.status(201).json({ 
        id: user.id,
        token: token,
        role: user.profile.role,
        store_id: updatedStore.id,
        stores: updatedStore,
        categories: categories,
        products: products?.products,
        hasMore: products?.hasMore,
        nextCursor: products?.nextCursor
        });

    } catch (error) {
        await t.rollback();
        const errorMsg = error.message || "Error desconocido";
        logger.error("Error en signInByDomain: " + errorMsg);
        return res.status(500).json({ error: "ServerError", details: errorMsg });
    }
    },

    async logout(req, res) {
    logger.info(`${req.user.name} - Cierra sessión`);

    try {
      const token = req.headers["authorization"]?.split(" ")[1]; // Obtener el token del encabezado Authorization

      if (!token) {
        return res.status(400).json({ msg: "No token proporcionado" });
      }

      const result = await UserTokenRepository.revokeByToken(token);
        if (!result.success) {
        return res.status(400).json({ msg: result.error });
        }

      // Responder al cliente
      res.status(200).json({ msg: "Logout exitoso" });
    } catch (err) {
      logger.error("Error al hacer logout: " + err.message);
      res.status(500).json({ error: "Error en el servidor" });
    }
  },

    async googleCallback(req, res, profile, storeId) {
    const t = await sequelize.transaction();
    const store = await StoreRepository.findById(storeId);
    if (!store) {
        return res.status(400).json({ success: false, message: "El elmacén no existe" });
      }
    try {
      const { id, name, email, image } = profile;
      const extractedName = email.split("@")[0];
      let user = await UserRepository.findByExternalIdAndAuth(id);
      let userProfile  = {}; // Definimos `person` aquí para que esté accesible en todo el bloque
      let imageUpdateNeeded = false;
      let imageUpdateData = {};
      if(!user){
         user = await UserRepository.findByEmailOrName(email);
      if (user) {
          userProfile = user.profile;
          if (image && userProfile.avatarUrl === "avatars/default.jpg") {
            imageUpdateNeeded = true;
            imageUpdateData = {
              avatarUrl: image,
              profile: userProfile
            };
          }
          // Actualiza el usuario si ya existe por correo
          await UserRepository.update(user, {
              external_id: id,
              external_auth: "google",
              name: name,
            },{ transaction: t });
        }else {
          // Crea un nuevo usuario si no existe ni por `external_id` ni por correo
          user = await UserRepository.create({
              name: extractedName,
              email: email,
              external_id: id,
              external_auth: "google", // Guardamos la URL de la imagen
            },{ transaction: t });

          // Crea la persona relacionada
          userProfile = await ProfileRepository.create({
              userId: user.id,
              fullName: name,
              role: 'user'
            }, { transaction: t });
          // Guarda la imagen desde la URL, si está disponible
          if (image) {
            imageUpdateNeeded = true;
            imageUpdateData = { avatarUrl: image, profile: userProfile };
          }
        }        
      }else{
        userProfile = user.profile;
            if (image && userProfile.avatarUrl === "avatars/default.jpg") {
            imageUpdateNeeded = true;
            imageUpdateData = {
              avatarUrl: image,
              profile: userProfile
            };
          }
      }
      const userNew = {
            id: user.id,
            email: user.email,
            name: user.name,
            profile: {
                id: userProfile.id, // Aquí accedes a la userProfilea creada
                fullName: userProfile.fullName,
                avatarUrl: userProfile.avatarUrl,
                role: userProfile.role
            },
        };
        await UserStoreRepository.associateUserToStore(
        userNew.id,
        store.id,
        userNew.profile.role
        ); 
        // Creamos el token
        const token = jwt.sign({ user: userNew }, authConfig.secret, {
            expiresIn: authConfig.expires,
        });

        // Decodificar el token para obtener la fecha de expiración
        const decoded = jwt.decode(token);

        // La fecha de expiración está en el campo 'exp' del JWT
        const expiresAt = new Date(decoded.exp * 1000); // 'exp' es en segundos, así que lo convertimos a milisegundos

        const userTokenData = {
            user_id: user.id,
            token: token,
            expires_at: expiresAt,
        };

        const usertoken = await UserTokenRepository.create(userTokenData);
        // Hacer commit de la transacción
      await t.commit();
       if (imageUpdateNeeded) {
        logger.info(`Actualizando imagen de perfil para el usuario ${userNew.id} desde Google.`);
        logger.info(JSON.stringify(imageUpdateData));
        await AuthController.handleImageUpdate(imageUpdateData);
      }
      const userData = {
        id: userNew.id,
            userName: userNew.name,
            email: userNew.email,
            token: token,
            store_id: store?.id || null,
            profileId: userNew.profile.id,
            fullName: userNew.profile.fullName,
            role: userNew.profile.role,
            avatarUrl: userNew.profile.avatarUrl,
      };

      const userDataString = encodeURIComponent(JSON.stringify(userData));
      return res.redirect(`${store.dminio}?user=${userDataString}`);
      //return res.status(200).json({ status: true, message: "Login relizado correctamente" });
    } catch (error) {
      if (!t.finished) {
        await t.rollback();
      }
      logger.error("Error en googleCallback:", error);
      return res.status(500).json({ error: "ServerError" });
    }
  },
  async handleImageUpdate({ avatarUrl, profile }) {
    try {
      const savedImagePath = await AuthController.saveImageFromUrl(
        avatarUrl,
        profile.id
      );
      await ProfileRepository.update(profile, { avatarUrl: savedImagePath });
      logger.info(`Imagen actualizada para persona ${profile.id}`);
    } catch (error) {
      logger.error(
        `Error actualizando imagen para persona ${profile.id}:`,
        error
      );
    }
  },

  // Método para descargar y guardar la imagen de perfil
  async saveImageFromUrl(avatarUrl, profileId) {
    try {
      const response = await axios.get(avatarUrl, {
        responseType: "stream",
        timeout: 5000, // Timeout de 5 segundos
      });

      const urlPath = new URL(avatarUrl).pathname;
      const extension = path.extname(urlPath) || ".jpg";
      const newFileName = `${profileId}${extension}`;
      const uploadsDir = path.join("public", "avatars");
      const imagePath = path.join(uploadsDir, newFileName);

      // ✅ Asegurar que el directorio exista
      await promisefs.mkdir(uploadsDir, { recursive: true });

      // Escribir el archivo
      await pipeline(response.data, fs.createWriteStream(imagePath));
      return `avatars/${newFileName}`; // Ruta relativa que se guardará en la base de datos
    } catch (error) {
      logger.error("Error al descargar la imagen:", error);
      return "avatars/default.jpg"; // Retorna la imagen por defecto en caso de fallo
    }
  },
};

module.exports = AuthController;