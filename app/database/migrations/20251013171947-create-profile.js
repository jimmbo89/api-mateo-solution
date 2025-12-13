'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('profiles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      user_id: {
         type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users', // Asegúrate de que 'Users' sea el nombre correcto de tu tabla de usuarios
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: 'ID del usuario en el sistema de autenticación (ej: Supabase auth.users)'
      },
      fullName: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Nombre completo del usuario'
      },
      avatarUrl: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'URL de la imagen de perfil'
      },
      role: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'user',
        comment: 'Rol del usuario (user, admin, seller, etc.)'
      },
      cpf: {
         type: Sequelize.STRING,
        allowNull: true,
        unique: true,
        comment: 'CPF (Cadastro de perosnas Físicas) del usuario'
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Número de teléfono del perfil, puede ser celular o fijo'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Opcional: añadir índice en userId para búsquedas rápidas
    await queryInterface.addIndex('profiles', ['userId'], {
      name: 'profiles_user_id_idx'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('profiles');
  }
};