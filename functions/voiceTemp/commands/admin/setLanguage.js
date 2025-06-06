const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { getDb } = require('../../../../database/mysql');
const { t } = require('../../../utils/translator');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set_language')
    .setDescription('Set the bot language for this server.')
    .addStringOption(option =>
      option.setName('language')
        .setDescription('Language code')
        .addChoices(
          { name: 'English', value: 'en' },
          { name: 'Español', value: 'es' }
        )
        .setRequired(true)
    ),
  async execute(interaction) {
    const member = interaction.member;
    if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      const msg = await t(interaction.guildId, 'Only administrators can use this command');
      return interaction.reply({ content: msg, ephemeral: true });
    }

    const lang = interaction.options.getString('language');
    const db = getDb();
    await db.execute(
      'INSERT INTO guild_settings (guild_id, language) VALUES (?, ?) ON DUPLICATE KEY UPDATE language = VALUES(language)',
      [interaction.guild.id, lang]
    );

    const confirmation = lang === 'es'
      ? 'El idioma del bot se ha configurado a Español.'
      : 'Bot language set to English.';

    return interaction.reply({ content: confirmation, ephemeral: true });
  }
};
