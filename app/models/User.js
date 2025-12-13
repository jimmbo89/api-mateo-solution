'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
       User.hasMany(models.UserToken, { foreignKey: 'user_id', as: 'tokens', onDelete: 'CASCADE' });
       User.hasOne(models.Profile, { foreignKey: 'userId', as: 'profile', onDelete: 'CASCADE' });
       User.hasMany(models.Store, { foreignKey: 'user_id', as: 'stores' });
       User.hasMany(models.Category, { foreignKey: 'user_id', as: 'categories' });
       User.hasMany(models.Comment, { foreignKey: 'user_id', as: 'coments' });
       User.hasMany(models.Order, { foreignKey: 'user_id', as: 'orders' });
       User.hasMany(models.OrderItem, { foreignKey: 'user_id', as: 'orderItems' });
       User.hasMany(models.Rating, { foreignKey: 'user_id', as: 'ratings' });
    }
  }
  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,   // Indica que 'id' es la clave primaria
      autoIncrement: true // Esto hace que el campo 'id' sea auto-incrementable
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,  // El nombre no puede ser nulo
      validate: {        
      len: {
        args: [2, 255],
        msg: "El nombre tiene que ser minimamente de dos caracteres"
      }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,  // El correo debe ser único
      validate: {
        isEmail: {
          msg: 'Debe ser un correo electrónico válido'
        }
      },
    },
    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,  // Puedes ajustar esto según si el password es obligatorio o no
      validate: {
        len: {
          args: [2, 255],
          msg: "El contraseña tiene que ser minimamente de seis  caracteres"
        }
      }
    },
    remember_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
     external_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    external_auth: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
  });
  return User;
};