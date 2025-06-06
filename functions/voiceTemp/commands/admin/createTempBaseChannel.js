// functions/voiceTemp/createTempBaseChannel.js

/**
 * Slash command to create a base voice channel in a Discord guild.
 * These base channels act as templates for dynamically generating temporary voice channels.
 * The limit is only stored in the database and not enforced visually on Discord.
 */

const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const { getDb } = require('../../../../database/mysql');
const { t } = require('./../../../utils/translator');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create_base_channel')
    .setDescription('Creates a new base voice channel used to generate temporary ones.')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Name of the base channel to create')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Maximum number of users (only stored in DB, not visually applied)')
        .setRequired(true)),

  /**
   * Executes the /create_base_channel command.
   * Validates admin permission, creates the voice channel,
   * and stores its configuration in the database.
   *
   * @param {import('discord.js').ChatInputCommandInteraction} interaction - The interaction object from Discord.
   */
  async execute(interaction) {
    const member = interaction.member;
    const name = interaction.options.getString('name');
    const limit = interaction.options.getInteger('limit');

    // Permission check: must be an administrator or have a role stored in the admin_roles table
    if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      const db = getDb();
      const [roles] = await db.execute(
        'SELECT role_id FROM admin_roles WHERE guild_id = ?', 
        [interaction.guild.id]
      );

      const adminRoleIDs = roles.map(r => r.role_id);
      const hasAdminRole = member.roles.cache.some(role => adminRoleIDs.includes(role.id));

      if (!hasAdminRole) {
        return interaction.reply({ 
          content: 'You do not have permission to use this command.', 
          ephemeral: true 
        });
      }
    }

    // Create a new voice channel with no visual user limit
    const channel = await interaction.guild.channels.create({
      name: name,
      type: ChannelType.GuildVoice,
      userLimit: 0 // visual user limit is removed; actual limit is stored in the DB only
    });

    // Store base channel metadata in the database
    const db = getDb();
    await db.execute(
      'INSERT INTO base_channels (guild_id, channel_id, user_limit, default_name) VALUES (?, ?, ?, ?)',
      [interaction.guild.id, channel.id, limit, name]
    );

    // Respond to the user with a confirmation message
    return interaction.reply({
      content: await t(interaction.guildId, 'Base channel **{name}** created. User limit stored in the database: {limit}.', { name: channel.name, limit }),
      ephemeral: true
    });
  }
};
