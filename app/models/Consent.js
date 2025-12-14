'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Consent extends Model {
    static associate(models) {
      Consent.belongsTo(models.User, { foreignKey: 'email', targetKey: 'email', as: 'user' });
    }
  }

  Consent.init({
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      comment: 'ID autoincremental del consentimiento'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      comment: 'Correo electrónico del usuario que dio consentimiento'
    },
    accepted_terms: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      comment: 'Indica si el usuario aceptó los términos'
    },
    accepted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha y hora en que se aceptaron los términos'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User-Agent del navegador del usuario'
    },
    language: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Idioma preferido (ej: es-ES, pt-BR)'
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Zona horaria del usuario'
    },
    screen_resolution: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Resolución de pantalla'
    },
    platform: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Plataforma del dispositivo'
    },
    device_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Tipo de dispositivo'
    },
    page_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'URL de la página de consentimiento'
    },
    referrer: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'URL de referencia'
    },
    terms_version: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Versión de los términos'
    },
    stripe_customer_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      comment: 'ID del cliente en Stripe'
    },
    stripe_subscription_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      comment: 'ID de la suscripción en Stripe'
    },
    plan: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Plan suscrito'
    },
    finalized_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha de finalización del proceso'
    }
  }, {
    sequelize,
    modelName: 'Consent',
    tableName: 'consents',
    timestamps: true
  });

  return Consent;
};