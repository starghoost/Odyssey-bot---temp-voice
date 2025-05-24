// functions/voiceTemp/commands/channel/registerBaseChannel.js

/**
 * Slash command that registers an existing voice channel as a base channel.
 * Base channels act as templates for generating temporary voice channels.
 * The specified user limit is stored in the database but not applied to the channel.
 */

const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const { getDb } = require('../../../../database/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('register_base_channel')
    .setDescription('Registers an existing voice channel as a base for temporary ones.')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The existing voice channel to register as base')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Maximum number of users (only stored in the database)')
        .setRequired(true)),

  /**
   * Executes the /register_base_channel command.
   * Verifies permission, then stores or updates the voice channel record in the base_channels table.
   *
   * @param {import('discord.js').ChatInputCommandInteraction} interaction - The command interaction object.
   */
  async execute(interaction) {
    const member = interaction.member;
    const channel = interaction.options.getChannel('channel');
    const limit = interaction.options.getInteger('limit');

    // Permission check: ADMINISTRATOR or a custom admin role from the database
    if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      const db = getDb();
      const [roles] = await db.execute(
        'SELECT role_id FROM admin_roles WHERE guild_id = ?',
        [interaction.guild.id]
      );
      const adminRoleIDs = roles.map(r => r.role_id);
      const hasAdminRole = member.roles.cache.some(role => adminRoleIDs.includes(role.id));
      if (!hasAdminRole) {
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      }
    }

    // Insert or update base channel in the database
    const db = getDb();
    await db.execute(
      `INSERT INTO base_channels (guild_id, channel_id, user_limit, default_name)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE user_limit = VALUES(user_limit)`,
      [interaction.guild.id, channel.id, limit, channel.name]
    );

    return interaction.reply({ 
      content: `✅ Channel **${channel.name}** has been registered as a base channel with a user limit of ${limit}.`, 
      ephemeral: true 
    });
  }
};
