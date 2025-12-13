'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Profile extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
     Profile.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    }
  }
  Profile.init({
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      comment: 'ID autoincremental del perfil'
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'ID del usuario en el sistema de autenticación'
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Nombre completo del usuario'
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL de la imagen de perfil'
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'user',
      comment: 'Rol del usuario (user, admin, seller, etc.)'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      comment: 'Número de teléfono del perfil, puede ser celular o fijo'
    },
    cpf: {
      type: DataTypes.STRING(11),
      allowNull: true,
      unique: true,
      comment: 'CPF (Cadastro de Pessoas Físicas) del usuario en Brasil'
    },
  }, {
    sequelize,
    modelName: 'Profile',
    tableName: 'profiles',
    timestamps: true
  });

  
  function normalizeRoles(roles) {
    if (!roles) return [];

    // Si es un string, devolver array con ese string
    if (typeof roles === 'string') {
      return [roles];
    }

    // Si es un array
    if (Array.isArray(roles)) {
      return roles.map(role => {
        if (typeof role === 'string') return role;
        if (role && typeof role === 'object' && typeof role.name === 'string') return role.name;
        return null; // o lanzar error si prefieres
      }).filter(Boolean); // elimina nulos/undefined
    }

    // Si es un objeto con propiedad 'name' (ej: rol individual como { name: 'admin' })
    if (roles && typeof roles === 'object' && typeof roles.name === 'string') {
      return [roles.name];
    }

    // Si no coincide con nada, devolver vacío
    return [];
  }

  Profile.hasRole = function(roles, targetRoles) {
    const normalizedInput = normalizeRoles(roles);
    const targets = Array.isArray(targetRoles) ? targetRoles : [targetRoles];
    return normalizedInput.some(role => targets.includes(role));
  };

  // Métodos específicos (opcionales, para retrocompatibilidad o conveniencia)
  Profile.isAdmin = function(roles) {
    return Profile.hasRole(roles, ['admin', 'administrador']);
  };

  Profile.isAdministrator = function(roles) {
    return Profile.hasRole(roles, ['administrador']);
  };

  Profile.isUser = function(roles) {
    return Profile.hasRole(roles, ['user', 'admin']);
  };
  return Profile;
};