// functions/voiceTemp/commands/channel/deleteBaseChannel.js

/**
 * Slash command to delete a base voice channel.
 * Base channels are templates used to automatically generate temporary voice channels.
 * This command removes the record from the database and attempts to delete the actual channel from Discord.
 */

const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const { getDb } = require('../../../../database/mysql');
const { t } = require('./../../../utils/translator');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete_base_channel')
    .setDescription('Deletes a base voice channel used to generate temporary ones.')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The base channel you want to delete')
        .addChannelTypes(ChannelType.GuildVoice) // Only allows voice channels
        .setRequired(true)),

  /**
   * Executes the /delete_base_channel command.
   * Validates admin permissions, removes the record from the DB, and deletes the Discord channel.
   *
   * @param {import('discord.js').ChatInputCommandInteraction} interaction - The command interaction.
   */
  async execute(interaction) {
    const member = interaction.member;
    const channel = interaction.options.getChannel('channel');

    // Permission check: must be an administrator or hold a custom admin role defined in the DB
    if (!member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      const db = getDb();

      // Get allowed role IDs from admin_roles table
      const [roles] = await db.execute('SELECT role_id FROM admin_roles WHERE guild_id = ?', [interaction.guild.id]);
      const adminRoleIDs = roles.map(r => r.role_id);

      // Check if the user has at least one of the allowed roles
      const hasAdminRole = member.roles.cache.some(role => adminRoleIDs.includes(role.id));

      if (!hasAdminRole) {
        return interaction.reply({ 
          content: 'You do not have permission to use this command.', 
          ephemeral: true 
        });
      }
    }

    // Delete the base channel reference from the database
    const db = getDb();
    await db.execute('DELETE FROM base_channels WHERE channel_id = ?', [channel.id]);

    // Attempt to delete the actual channel from Discord
    try {
      await channel.delete();
    } catch (err) {
      console.warn('Failed to delete the Discord channel:', err.message);
    }

    // Confirm the deletion to the user
    return interaction.reply({
      content: await t(interaction.guildId, 'The base channel **{name}** has been deleted.', { name: channel.name }),
      ephemeral: true
    });
  }
};
