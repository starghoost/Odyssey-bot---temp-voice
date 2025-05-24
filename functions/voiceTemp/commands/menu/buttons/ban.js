// functions/voiceTemp/commands/menu/buttons/ban.js

/**
 * Handles the "ban" button and user selection for blocking a user from a temporary voice channel.
 * Only the channel owner can perform this action.
 */

const { ActionRowBuilder, UserSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const { getDb } = require('../../../../../database/mysql');

module.exports = {
  id: ['ban', 'select_ban_target'],

  /**
   * Executes either the initial "ban" button click or the user selection menu.
   * Adds the user to the channel_bans table and disconnects them if necessary.
   *
   * @param {import('discord.js').Interaction} interaction - The interaction (button or user select menu)
   */
  async execute(interaction) {
    const member = interaction.member;

    // Step 1: Initial "ban" button was clicked
    if (interaction.isButton()) {
      const channel = member.voice?.channel;
      if (!channel) {
        return interaction.reply({ content: 'You must be in a voice channel to use this option.', ephemeral: true });
      }

      const db = getDb();
      const [rows] = await db.execute('SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', [channel.id]);

      if (!rows.length || rows[0].owner_id !== member.id) {
        return interaction.reply({ content: 'Only the owner of the channel can block users.', ephemeral: true });
      }

      const row = new ActionRowBuilder().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId('select_ban_target')
          .setPlaceholder('Select a user to block')
          .setMinValues(1)
          .setMaxValues(1)
      );

      return interaction.reply({ 
        content: 'Select the user you want to block:', 
        components: [row], 
        ephemeral: true 
      });
    }

    // Step 2: User selected from the menu
    if (interaction.isUserSelectMenu() && interaction.customId === 'select_ban_target') {
      const userId = interaction.values[0];
      const guild = interaction.guild;

      const target = await guild.members.fetch(userId).catch(() => null);
      const member = await guild.members.fetch(interaction.user.id);
      const channel = member.voice?.channel;

      if (!target || !channel) {
        return interaction.reply({ content: 'Invalid user or no active voice channel.', ephemeral: true });
      }

      const db = getDb();
      const [rows] = await db.execute('SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', [channel.id]);
      if (!rows.length || rows[0].owner_id !== member.id) {
        return interaction.reply({ content: 'You do not have permission to perform this action.', ephemeral: true });
      }

      // Prevent banning users with admin roles or permissions
      const [roles] = await db.execute('SELECT role_id FROM admin_roles WHERE guild_id = ?', [guild.id]);
      const adminRoles = roles.map(r => r.role_id);
      const hasAdminRole = target.roles.cache.some(role => adminRoles.includes(role.id));
      if (hasAdminRole || target.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: 'You cannot block an administrator or a user with admin roles.', ephemeral: true });
      }

      // Register ban in database
      await db.execute(
        'INSERT IGNORE INTO channel_bans (temp_channel_id, banned_user_id) VALUES (?, ?)',
        [channel.id, userId]
      );

      // Disconnect the user if currently in the channel
      if (target.voice.channelId === channel.id) {
        await target.voice.disconnect();
      }

      await interaction.deferUpdate();
      return interaction.followUp({ 
        content: `User **${target.user.tag}** has been blocked from the channel.`, 
        ephemeral: true 
      });
    }
  }
};
