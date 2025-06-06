// functions/voiceTemp/commands/menu/buttons/kick.js

/**
 * Handles the "kick" button and user selection for removing users from a temporary voice channel.
 * Only the owner of the channel can perform this action, and it excludes admins/moderators.
 */

const { ActionRowBuilder, UserSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const { t } = require('./../../../../utils/translator');
const { getDb } = require('../../../../../database/mysql');

module.exports = {
  id: ['kick', 'select_kick_target'],

  /**
   * Executes the button or user select menu interaction for kicking a user.
   *
   * @param {import('discord.js').Interaction} interaction - The interaction object
   */
  async execute(interaction) {
    const member = interaction.member;

    // Step 1: Button clicked, show user selector
    if (interaction.isButton()) {
      const channel = member.voice?.channel;
      if (!channel) {
        return interaction.reply({ content: await t(interaction.guildId, 'You must be in a voice channel to use this option.'), ephemeral: true });
      }

      const db = getDb();
      const [rows] = await db.execute('SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', [channel.id]);
      if (!rows.length || rows[0].owner_id !== member.id) {
        return interaction.reply({ content: await t(interaction.guildId, 'Only the owner of the channel can kick users.'), ephemeral: true });
      }

      const row = new ActionRowBuilder().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId('select_kick_target')
          .setPlaceholder('Select the user to kick')
          .setMinValues(1)
          .setMaxValues(1)
      );

      return interaction.reply({ 
        content: await t(interaction.guildId, 'Select the user you want to kick:'), 
        components: [row], 
        ephemeral: true 
      });
    }

    // Step 2: Handle user selection and perform kick
    if (interaction.isUserSelectMenu() && interaction.customId === 'select_kick_target') {
      const userId = interaction.values[0];
      const guild = interaction.guild;
      const target = await guild.members.fetch(userId).catch(() => null);
      const member = await guild.members.fetch(interaction.user.id);
      const channel = member.voice?.channel;

      if (!target || !channel) {
        return interaction.reply({ content: await t(interaction.guildId, 'Invalid user or channel not available.'), ephemeral: true });
      }

      const db = getDb();
      const [rows] = await db.execute('SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', [channel.id]);
      if (!rows.length || rows[0].owner_id !== member.id) {
        return interaction.reply({ content: await t(interaction.guildId, 'You do not have permission to perform this action.'), ephemeral: true });
      }

      const [roles] = await db.execute('SELECT role_id FROM admin_roles WHERE guild_id = ?', [guild.id]);
      const adminRoles = roles.map(r => r.role_id);
      const hasAdminRole = target.roles.cache.some(role => adminRoles.includes(role.id));
      if (hasAdminRole || target.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: await t(interaction.guildId, 'You cannot kick an administrator or a user with administrative roles.'), ephemeral: true });
      }

      if (target.voice.channelId === channel.id) {
        await target.voice.disconnect();
      }

      await interaction.deferUpdate();
      return interaction.followUp({
        content: await t(interaction.guildId, 'User **{user}** has been kicked from the channel.', { user: target.user.tag }),
        ephemeral: true
      });
    }
  }
};
