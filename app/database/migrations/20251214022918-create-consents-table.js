'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('consents', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
        comment: 'ID autoincremental del consentimiento'
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true, // permitido null por flexibilidad futura
        unique: true,
        comment: 'Correo electrónico del usuario que dio consentimiento'
      },
      accepted_terms: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        comment: 'Indica si el usuario aceptó los términos'
      },
      accepted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Fecha y hora en que se aceptaron los términos'
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'User-Agent del navegador del usuario'
      },
      language: {
        type: Sequelize.STRING(10),
        allowNull: true,
        comment: 'Idioma preferido del usuario (ej: es-ES, pt-BR)'
      },
      timezone: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Zona horaria del usuario'
      },
      screen_resolution: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Resolución de pantalla (ej: 1920x1080)'
      },
      platform: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Plataforma del dispositivo (ej: MacIntel, Win32)'
      },
      device_type: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Tipo de dispositivo (desktop, mobile, tablet)'
      },
      page_url: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'URL de la página donde se dio el consentimiento'
      },
      referrer: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'URL de referencia (página anterior)'
      },
      terms_version: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Versión de los términos aceptados (ej: v1.0)'
      },
      stripe_customer_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
        comment: 'ID del cliente en Stripe'
      },
      stripe_subscription_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
        comment: 'ID de la suscripción en Stripe'
      },
      plan: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Plan suscrito (ej: basic, premium)'
      },
      finalized_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Fecha en que se finalizó el proceso (suscripción activa)'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Índices opcionales para búsquedas frecuentes
    await queryInterface.addIndex('consents', ['email'], { name: 'consents_email_idx' });
    await queryInterface.addIndex('consents', ['stripe_customer_id'], { name: 'consents_stripe_customer_idx' });
    await queryInterface.addIndex('consents', ['accepted_at'], { name: 'consents_accepted_at_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('consents');
  }
};