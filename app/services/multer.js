const multer = require('multer');
const path = require('path');
const fs = require('fs').promises; // Uso de promesas con fs

// Función para determinar dinámicamente la carpeta de destino
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        let folder = '';

        // Lógica para determinar el folder según la ruta o controlador
        if (req.baseUrl.includes('/api/person')) {
            folder = 'public/people';
        } else if (req.baseUrl.includes('/api/category')) {
            folder = 'public/categories';
        } else {
            folder = 'public/uploads'; // Directorio por defecto
        }

        try {
            // Verificar si la carpeta existe
            await fs.access(folder);
        } catch (error) {
            // Crear la carpeta si no existe
            try {
                await fs.mkdir(folder, { recursive: true });
            } catch (mkdirError) {
                return cb(new Error(`Error al crear el directorio: ${mkdirError.message}`));
            }
        }

        // Retornar la carpeta en el callback
        cb(null, folder);
    },
    filename: function (req, file, cb) {
        const uniqueName = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
        cb(null, uniqueName); // Nombre único para la imagen
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Limitar tamaño a 2MB
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Solo se permiten imágenes (jpeg, jpg, png)');
        }
    }
}).single('image'); // 'image' es el campo en el formulario para el archivo

module.exports = upload;
