require('dotenv').config({ quiet: true });
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const express = require("express");
const app = express();
//const session = require('express-session');
const { sequelize } = require('./models/index');
const cors = require('cors');
const logger = require('../config/logger');

// // Sesión
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'mateomi-fallback-secret',
//   resave: false,
//   saveUninitialized: true
// }));

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_OAUTH_ID,
      clientSecret: process.env.GOOGLE_OAUTH_KEY,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
      scope: ["profile", "email"], // Asegúrate de incluir estos alcances
    },
    (accessToken, refreshToken, profile, done) => {
      // No llamar a done aquí, solo pasar el perfil a la ruta
      // Acceso a los datos
      const user_id = profile.id;
      const userName = profile.displayName;
      const userEmail = profile.emails
        ? profile.emails[0].value
        : "No disponible";
      const userData = {
        id: user_id, // ID del usuario en Google
        name: userName, // Nombre del usuario
        email: userEmail, // Email del usuario
        image: profile.photos[0]?.value, // URL de la imagen de perfil
      };
      //console.log("Datos del usuario:", userData); // Para verificar que se está creando correctamente
      done(null, userData);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// CORS con múltiples orígenes
const PORT = process.env.PORT || 8080;
const ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:3000";
const allowedOrigins = ORIGIN
  .split(',')
  .map(s => s.trim())
  .filter(Boolean); // Soporta uno o varios orígenes

app.use(cors({
  origin: function (origin, callback) {
    console.log('Origin recibido:', origin);
    if (!origin) return callback(null, true); // Postman, móvil, etc.
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origen no permitido'), false);
  },
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
    'X-Flow-Token',
    'X-Request-Id'
  ],
  credentials: true
}));

// Parseo de cuerpo
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
//swagger
const swaggerUi = require('swagger-ui-express');
const swaggerDocumentation = require('../swagger.json'); 
// Rutas
app.use('/api', require('./routes'));
app.use('/api-mateo-solution-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocumentation));
console.log('✅ Ruta /docs registrada');

// Documentación Swagger

// Health check
app.get('/', (req, res) => {
  res.json({ ok: true, service: 'api-mateo-solution', env: process.env.NODE_ENV || 'development' });
});

// Iniciar servidor
const server = app.listen(process.env.PORT || 8080, '0.0.0.0', async () => {
  try {
    logger.info(`🚀 Servidor escuchando en http://0.0.0.0:${PORT}`);

    // ✅ Intentar conectar a la base de datos
    await sequelize.authenticate();
    logger.info('✅ Conexión a la base de datos exitosa');

    // ✅ Log opcional con tu logger (si existe)
    if (logger && typeof logger.info === 'function') {
      logger.info(`🚀 Servidor escuchando en http://0.0.0.0:${PORT}`);
      logger.info('✅ Conexión a la base de datos exitosa');
    }
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
    if (logger && typeof logger.error === 'function') {
      logger.error('❌ Error al conectar a la base de datos:', error);
    }
    process.exit(1);
  }
});


// Cierre elegante
process.on('SIGINT', async () => {
  try {
    logger.info('CloseOperation: Cerrando conexión a la base de datos...');
    await sequelize.close();
    logger.info('CloseOperation: Conexión cerrada.');
    server.close(() => {
      logger.info('CloseOperation: Servidor detenido.');
      process.exit(0);
    });
  } catch (error) {
    logger.error('CloseOperation: Error crítico:', error);
    process.exit(1);
  }
});