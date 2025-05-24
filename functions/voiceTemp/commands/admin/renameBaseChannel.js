// functions/voiceTemp/commands/channel/renameBaseChannel.js

/**
 * Slash command to rename an existing base voice channel.
 * This updates both the channel name in Discord and the record in the database.
 */

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { getDb } = require('../../../../database/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rename_base_channel')
    .setDescription('Renames an existing base channel.')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The base channel to rename')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('name')
        .setDescription('New name for the channel')
        .setRequired(true)),

  /**
   * Executes the /rename_base_channel command.
   * Verifies permissions, checks if the channel is registered as a base,
   * renames the Discord channel, and updates the DB.
   *
   * @param {import('discord.js').ChatInputCommandInteraction} interaction - The interaction object from Discord.
   */
  async execute(interaction) {
    const member = interaction.member;
    const channel = interaction.options.getChannel('channel');
    const newName = interaction.options.getString('name');

    // Permission check: must be admin or have a DB-defined admin role
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

    const db = getDb();
    const [rows] = await db.execute('SELECT * FROM base_channels WHERE channel_id = ?', [channel.id]);

    if (!rows.length) {
      return interaction.reply({ content: '❌ This channel is not registered as a base channel.', ephemeral: true });
    }

    // Try renaming the channel in Discord
    try {
      await channel.setName(newName);
    } catch (err) {
      return interaction.reply({ content: '❌ Failed to rename the channel on Discord.', ephemeral: true });
    }

    // Update the stored name in the database
    await db.execute(
      'UPDATE base_channels SET default_name = ? WHERE channel_id = ?',
      [newName, channel.id]
    );

    return interaction.reply({ 
      content: `✅ The base channel has been renamed to **${newName}**.`, 
      ephemeral: true 
    });
  }
};

