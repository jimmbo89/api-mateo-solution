// policies/rolePolicy.js
const { Profile } = require('../models');

/**
 * Middleware de autorización por roles.
 * @param {string | string[]} allowedRoles - Rol o lista de roles permitidos (ej: 'admin' o ['admin', 'seller'])
 */
function requireRoles(allowedRoles) {
  // Aseguramos que allowedRoles sea un array
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    const profile = req.profile;

    if (!profile) {
      return res.status(403).json({ message: 'Perfil no disponible. Autenticación requerida.' });
    }

    // Extraemos el rol del perfil (puede ser un string)
    const userRoles = profile.role; // Esto es un string, ej: 'admin'

    // Usamos el método genérico `hasRole` del modelo Profile
    if (Profile.hasRole(userRoles, rolesArray)) {
      return next();
    }

    return res.status(403).json({
      message: 'Acceso denegado: no tienes los permisos necesarios.',
      requiredRoles: rolesArray,
      yourRole: userRoles
    });
  };
}

module.exports = { requireRoles };