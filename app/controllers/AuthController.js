const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authConfig = require("../../config/auth");
const { sequelize } = require("../models");
const logger = require("../../config/logger");
const fs = require("fs");
const promisefs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const { pipeline } = require("stream/promises");
const {
  UserRepository,
  UserTokenRepository,
  ProfileRepository,
} = require("../repositories");

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

      let origin = req.get("Origin");
      if (!origin) {
        const host = req.get("Host");
        const protocol = req.protocol;
        origin = `${protocol}://${host.split(":")[0]}`;
      }
      const userNew = {
        id: user.id,
        email: user.email,
        name: user.name,
        profile: {
          id: user.profile.id,
          fullName: user.profile.fullName,
          avatarUrl: user.profile.avatarUrl,
          role: user.profile.role,
        },
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
        remember_token: null, // o genera uno si lo usas
      };

      // 5. Llamar al repositorio
      const user = await UserRepository.create(userData);

      const profileData = {
        user_id: user.id,
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
          role: profile.role,
        },
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
      // Hacer commit de la transacción
      await t.commit();
      // Respuesta en formato JSON
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
      // Revertir la transacción en caso de error
      await t.rollback();
      const errorMsg = error.details
        ? error.details.map((detail) => detail.message).join(", ")
        : error.message || "Error desconocido";

      logger.error("Error al registrar usuario: " + errorMsg);
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

  async googleCallback(req, res, profile) {
    const t = await sequelize.transaction();
    try {
      const { id, name, email, image } = profile;
      const extractedName = email.split("@")[0];
      let user = await UserRepository.findByExternalIdAndAuth(id);
      let userProfile = {}; // Definimos `person` aquí para que esté accesible en todo el bloque
      let imageUpdateNeeded = false;
      let imageUpdateData = {};
      if (!user) {
        user = await UserRepository.findByEmailOrName(email);
        if (user) {
          userProfile = user.profile;
          if (
            image &&
            image.trim() !== "" &&
            userProfile.avatarUrl === "avatars/default.jpg"
          ) {
            imageUpdateNeeded = true;
            imageUpdateData = {
              avatarUrl: image,
              profile: userProfile,
            };
          }
          // Actualiza el usuario si ya existe por correo
          await UserRepository.update(
            user,
            {
              external_id: id,
              external_auth: "google",
              name: name,
            },
            t
          );
        } else {
          // Crea un nuevo usuario si no existe ni por `external_id` ni por correo
          user = await UserRepository.create(
            {
              name: extractedName,
              email: email,
              external_id: id,
              external_auth: "google", // Guardamos la URL de la imagen
            },
            t
          );

          // Crea la persona relacionada
          userProfile = await ProfileRepository.create(
            {
              user_id: user.id,
              fullName: name,
              role: "user",
            },
            null,
            t
          );
          // Guarda la imagen desde la URL, si está disponible
          if (image) {
            imageUpdateNeeded = true;
            imageUpdateData = { avatarUrl: image, profile: userProfile };
          }
        }
      } else {
        userProfile = user.profile;
        if (image && userProfile.avatarUrl === "avatars/default.jpg") {
          imageUpdateNeeded = true;
          imageUpdateData = {
            avatarUrl: image,
            profile: userProfile,
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
          role: userProfile.role,
        },
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
      // Hacer commit de la transacción
      await t.commit();
      if (imageUpdateNeeded) {
        logger.info(
          `Actualizando imagen de perfil para el usuario ${userNew.id} desde Google.`
        );
        logger.info(JSON.stringify(imageUpdateData));
        await AuthController.handleImageUpdate(imageUpdateData);
      }
      const userData = {
        id: userNew.id,
        userName: userNew.name,
        email: userNew.email,
        token: token,
        profileId: userNew.profile.id,
        fullName: userNew.profile.fullName,
        role: userNew.profile.role,
        avatarUrl: userNew.profile.avatarUrl,
      };

      const userDataString = encodeURIComponent(JSON.stringify(userData));
      return res.redirect(`http://127.0.0.1:8080/?user=${userDataString}`);
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
