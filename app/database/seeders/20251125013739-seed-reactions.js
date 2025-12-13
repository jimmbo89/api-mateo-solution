// seeds/XXXX-seed-reactions.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('reactions', [
      { name: 'Me gusta', code: 'like', emoji: '👍', is_active: true },
      { name: 'Me encanta', code: 'heart', emoji: '❤️', is_active: true },
      { name: 'Me divierte', code: 'laugh', emoji: '😂', is_active: true },
      { name: 'Asombroso', code: 'wow', emoji: '😮', is_active: true },
      { name: 'Triste', code: 'sad', emoji: '😢', is_active: true },
      { name: 'Enojado', code: 'angry', emoji: '😠', is_active: true }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('reactions', { code: ['like', 'heart', 'laugh', 'wow', 'sad', 'angry'] });
  }
};