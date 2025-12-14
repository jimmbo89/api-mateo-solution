const express = require("express");
const logger = require('../config/logger');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const mime = require('mime-types'); 
const passport = require('passport');

//Middlewares
const auth = require("./middlewares/auth");

//pilicies
const { requireRoles } = require('./policies/RolePolicity.js')
const validateSchema = require("./middlewares/validateSchema");
//const multerMultiple = require('./middlewares/multerMultiple'); // Middleware de multer
const multerImage = require('./middlewares/multerImage');
const multerFieldFolders = require('./middlewares/multerFieldFolders');

const AuthController = require('./controllers/AuthController');
const ProfileController = require("./controllers/ProfileController");


// Validaciones
const { registerSchema, loginSchema, } = require("./middlewares/validations/authValidtion");
const { profileSchema, profileUpdateSchema, idProfileSchema } = require('./middlewares/validations/profileValidation');


router.get("/", (req, res) => res.json({ hello: "World" }));

router.post("/sign-up", validateSchema(registerSchema), AuthController.signUp);
router.post("/sign-in", validateSchema(loginSchema), AuthController.signIn);

router.get('/login-google', async (req, res, next) => {
  try {
    let origin = req.get('Origin');
    if (!origin) {
      const host = req.get('Host'); // "127.0.0.1:8080"
      const protocol = req.protocol; // "http"
      origin = `${protocol}://${host}`;
    }
    // ✅ Ahora sí puedes usar store.store_id
    passport.authenticate('google', {
      scope: ['profile', 'email']
    })(req, res, next);

  } catch (error) {
    logger.error('Error en /login-google:', error);
    return res.status(500).json({ error: 'Error interno al iniciar login con Google' });
  }
});

router.get('/google-callback', (req, res, next) => {
  const storeId = req.query.state; // ← ¡Aquí lo recuperas!
  logger.info(`Callback de Google`);
  logger.info(JSON.stringify(req.query));
    passport.authenticate('google', { session: false }, async (err, user, info) => {
      if (err) {
        logger.error('Error en la autenticación de Google:', err);
        return res.status(500).json({ error: 'Error en la autenticación de Google' });
      }
      if (!user) {
        logger.error('Usuario no encontrado en la respuesta de Google:', info);
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      //console.log('Datos en la ruta:', user);
      // Llama a tu función en el controlador aquí
      try {
        await AuthController.googleCallback(req, res, user, storeId);
      } catch (error) {
        logger.error('Error al llamar a googleCallback:', error);
        return res.status(500).json({ error: 'Error en el procesamiento de la respuesta' });
      }
    })(req, res, next);
});
// Ruta para servir imágenes desde la carpeta `public`
router.get('/images/:foldername/:filename', (req, res) => {
    const { foldername, filename } = req.params;
    const imagePath = path.join(__dirname, '../public', foldername, filename);

    // Verifica si el archivo existe
    if (!fs.existsSync(imagePath)) {
        return res.status(404).send('Imagen no encontrada');
    }

    // Obtén el tipo MIME del archivo
    const fileType = mime.lookup(imagePath) || 'application/octet-stream';

    // Lee el archivo y envíalo en la respuesta
    fs.readFile(imagePath, (err, file) => {
        if (err) {
            return res.status(500).send('Error al leer la imagen');
        }
        res.writeHead(200, { 'Content-Type': fileType });
        res.end(file);
    });
});

//rutas protegidas
router.use(auth);
//Profie
//router.get('/profiles', requireRoles(['admin', 'administrador']), ProfileController.index); // Listar todos los perfiles
router.post('/profile', requireRoles(['admin', 'administrador']), multerImage('avatarUrl', 'avatarUrl'), validateSchema(profileSchema),  ProfileController.store );

//router.post('/profile-show', requireRoles(['admin', 'administrador']), validateSchema(idProfileSchema),  ProfileController.show );
router.post('/profile-update', requireRoles(['admin', 'administrador']), multerImage('avatarUrl', 'avatarUrl'),  validateSchema(profileUpdateSchema), ProfileController.update );
router.post('/profile-destroy', requireRoles(['admin', 'administrador']), validateSchema(idProfileSchema),  ProfileController.destroy );
router.post('/profile-by-user-id', requireRoles(['user', 'admin', 'administrador']), validateSchema(idProfileSchema), ProfileController.getByUserId );
router.get("/logout", AuthController.logout);

module.exports = router;