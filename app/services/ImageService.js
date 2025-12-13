const path = require('path');
const fs = require('fs');
const logger = require('../../config/logger'); // Asegúrate de que este sea tu logger configurado

const ImageService = {
  // Mover archivo a un nuevo destino
  async moveFile(file, destination) {
    const newPath = path.join(__dirname, '..', '..', 'public', destination);

    try {
      await fs.promises.rename(file.path, newPath);
      logger.info(`Imagen movida exitosamente a: ${newPath}`);
      return destination;
    } catch (err) {
      logger.error(`Error al mover la imagen: ${err.message}`);
      throw new Error('Error al mover la imagen');
    }
  },

  async copyFile(file, destination) {
    const newPath = path.join(__dirname, '..', '..', 'public', destination);
  
    try {
      await fs.promises.copyFile(file.path, newPath);
      logger.info(`Imagen copiada exitosamente a: ${newPath}`);
      return destination;
    } catch (err) {
      logger.error(`Error al copiar la imagen: ${err.message}`);
      throw new Error('Error al copiar la imagen');
    }
  },

  // Eliminar archivo si existe
  async deleteFile(filepath) {
    const fullPath = path.join(__dirname, '..', '..', 'public', filepath);

    if (fs.existsSync(fullPath)) {
      try {
        await fs.promises.unlink(fullPath);
        logger.info(`Archivo eliminado exitosamente: ${fullPath}`);
      } catch (err) {
        logger.error(`Error al eliminar el archivo: ${err.message}`);
        throw new Error('Error al eliminar el archivo');
      }
    }
  },

  async deleteFileArray(files) {
    for (const file of files) {
      // Verificar si el objeto file tiene la propiedad path
      if (!file.path || typeof file.path !== 'string') {
        logger.warn(`Archivo omitido: la propiedad "path" no está definida o no es válida en el objeto: ${JSON.stringify(file)}`);
        continue; // Omitir este archivo y continuar con el siguiente
      }
  
      const fullPath = path.join(__dirname, '..', '..', 'public', file.path);
  
      try {
        await fs.promises.unlink(fullPath);
        logger.info(`Archivo eliminado exitosamente: ${fullPath}`);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          // Si el error no es "archivo no encontrado", lo registramos y lanzamos el error
          logger.error(`Error al eliminar el archivo: ${err.message}`);
          throw new Error('Error al eliminar el archivo');
        }
        // Si el error es "ENOENT" (archivo no encontrado), no hacemos nada
      }
    }
  },

  // Generar nombre de archivo único
  generateFilename(folder, id, originalName) {
    const extension = path.extname(originalName);
    return `${folder}/${id}${extension}`;
  },
};

module.exports = ImageService;
