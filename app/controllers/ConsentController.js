const { sequelize } = require("../models");
const logger = require("../../config/logger");
const { ConsentRepository } = require("../repositories");

const ConsentController = {
  async index(req, res) {
    try {
      const consents = await ConsentRepository.findAll();
      return res.status(200).json({ consents: consents });
    } catch (error) {
      logger.error("ConsentController->index:", error);
      return res.status(500).json({ error: "ServerError" });
    }
  },

  async show(req, res) {
    const { id } = req.params || req.body;
    if (!id) return res.status(400).json({ msg: "ConsentIdRequired" });

    try {
      const consent = await ConsentRepository.findById(id);
      if (!consent) return res.status(404).json({ msg: "ConsentNotFound" });
      return res.status(200).json({ consent: consent });
    } catch (error) {
      logger.error(`ConsentController->show (ID: ${id}):`, error);
      return res.status(500).json({ error: "ServerError" });
    }
  },

  async store(req, res) {
    logger.info("Creando nuevo consentimiento");
    logger.info("datos recibidos:");
    logger.info(JSON.stringify(req.body));
    const {
      email,
      accepted_terms,
      accepted_at,
      user_agent,
      language,
      timezone,
      screen_resolution,
      platform,
      device_type,
      page_url,
      referrer,
      terms_version,
      stripe_customer_id,
      stripe_subscription_id,
      plan,
      finalized_at,
    } = req.body;
    const t = await sequelize.transaction();
    try {
      const consent = await ConsentRepository.create(req.body, t);
      await t.commit();
      return res.status(201).json({ consent });
    } catch (error) {
      await t.rollback();
      logger.error("ConsentController->store:", error);
      return res
        .status(500)
        .json({ error: "ServerError", details: error.message });
    }
  },
  async update(req, res) {
    logger.info("Editando consentimiento");
    logger.info("datos recibidos:");
    logger.info(JSON.stringify(req.body));
    const {
      id,
      email,
      stripe_customer_id,
      stripe_subscription_id,
      accepted_terms,
      accepted_at,
      user_agent,
      language,
      timezone,
      screen_resolution,
      platform,
      device_type,
      page_url,
      referrer,
      terms_version,
      plan,
      finalized_at,
    } = req.body;
    const field = Object.keys(req.body)[0];
    const identifierValue = req.body[field];

    // Eliminar campos identificadores del update
      const updateData = { ...req.body };
    delete updateData.id;

    logger.info(`Actualizando consentimiento por ${field}: ${identifierValue}`);

    try {
      const consent = await ConsentRepository.findByIdentifier(
        field,
        identifierValue
      );
      if (!consent) {
        return res.status(404).json({ msg: "ConsentNotFound" });
      }

      const t = await sequelize.transaction();
      try {
        const updated = await ConsentRepository.update(consent, updateData, t);
        await t.commit();
        return res.status(200).json({ consent: updated });
      } catch (error) {
        await t.rollback();
        throw error;
      }
    } catch (error) {
      logger.error(
        `ConsentController->update (${field}=${identifierValue}):`,
        error
      );
      return res
        .status(500)
        .json({ error: "ServerError", details: error.message });
    }
  },

  async destroy(req, res) {
    logger.info("Eliminando consentimiento");
    logger.info("datos recibidos:");
    logger.info(JSON.stringify(req.body));
    const field = Object.keys(req.body)[0];
    const identifierValue = req.body[field];

    logger.info(
      `Eliminando consentimiento por identificador:${field}: ${identifierValue}`
    );

    try {
      const consent = await ConsentRepository.findByIdentifier(
        field,
        identifierValue
      );
      if (!consent) {
        return res.status(404).json({ msg: "ConsentNotFound" });
      }

      await ConsentRepository.delete(consent);
      return res.status(200).json({ msg: "ConsentDeleted" });
    } catch (error) {
      logger.error(`ConsentController->destroy (${identifier}):`, error);
      return res.status(500).json({ error: "ServerError" });
    }
  },

  async getByIdentifier(req, res) {
    logger.info("Buscando consentimiento");
    logger.info("datos recibidos:");
    logger.info(JSON.stringify(req.body));
    const { id, email, stripe_customer_id, stripe_subscription_id } = req.body;

    const field = Object.keys(req.body)[0];
    const value = req.body[field];
    try {
      const consent = await ConsentRepository.findByIdentifier(field, value);
      if (!consent) return res.status(404).json({ msg: "ConsentNotFound" });
      return res.status(200).json({ consent: consent });
    } catch (error) {
      logger.error(`ConsentController->getByIdentifier:`, error);
      return res.status(500).json({ error: "ServerError" });
    }
  },
};

module.exports = ConsentController;
