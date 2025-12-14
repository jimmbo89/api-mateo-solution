const { Op } = require("sequelize");
const { Consent } = require("../models");
const logger = require("../../config/logger");
const UPDATABLE_FIELDS = [
  "email",
  "accepted_terms",
  "accepted_at",
  "user_agent",
  "language",
  "timezone",
  "screen_resolution",
  "platform",
  "device_type",
  "page_url",
  "referrer",
  "terms_version",
  "stripe_customer_id",
  "stripe_subscription_id",
  "plan",
  "finalized_at",
];

const IDENTIFIER_COLUMNS = ['id', 'email', 'stripe_customer_id', 'stripe_subscription_id'];

const ConsentRepository = {
  async findAll() {
    return await Consent.findAll();
  },

  async findById(id) {
    return await Consent.findByPk(id);
  },

  async findByEmail(email) {
    return await Consent.findOne({ where: { email } });
  },

  async findByIdentifier(field, value) {
  if (!IDENTIFIER_COLUMNS.includes(field)) {
    throw new Error(`Campo identificador no permitido: ${field}`);
  }

  const where = { [field]: value };
  if (field === 'id') {
    return await Consent.findByPk(value);
  } else {
    return await Consent.findOne({ where });
  }
},

  async create(data, transaction = null) {
    try {
      const cleanData = Object.keys(data)
        .filter(
          (key) => UPDATABLE_FIELDS.includes(key) && data[key] !== undefined
        )
        .reduce((obj, key) => {
          obj[key] = data[key];
          return obj;
        }, {});

      return await Consent.create(cleanData, { transaction });
    } catch (error) {
      logger.error("Error al crear consentimiento:", error);
      throw new Error(`Error al crear consentimiento: ${error.message}`);
    }
  },

  async update(consent, data, transaction = null) {
    try {
      // Filtrar solo los campos permitidos y definidos
      const updatedData = Object.keys(data)
        .filter(
          (key) => UPDATABLE_FIELDS.includes(key) && data[key] !== undefined
        )
        .reduce((obj, key) => {
          obj[key] = data[key];
          return obj;
        }, {});

      if (Object.keys(updatedData).length === 0) {
        logger.warn(
          `Ningún campo válido para actualizar en consentimiento ID ${consent.id}`
        );
        return consent;
      }

      await consent.update(updatedData, { transaction });
      logger.info(
        `Consentimiento actualizado exitososamente (ID: ${consent.id})`
      );
      return consent;
    } catch (error) {
      logger.error(
        `Error al actualizar consentimiento ID ${consent.id}:`,
        error
      );
      throw error;
    }
  },

  async delete(consent) {
    try {
      await consent.destroy();
      return true;
    } catch (error) {
      logger.error(`Error al eliminar consentimiento ID ${consent.id}:`, error);
      throw new Error(`Error al eliminar consentimiento: ${error.message}`);
    }
  },
};

module.exports = ConsentRepository;
