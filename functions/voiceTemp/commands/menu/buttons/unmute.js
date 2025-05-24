// functions/voiceTemp/commands/menu/buttons/unmute.js

/**
 * Handles the "unmute" button and user selection interaction.
 * Allows the owner of a temporary voice channel to unmute a selected member.
 */

const { ActionRowBuilder, UserSelectMenuBuilder } = require('discord.js');
const { getDb } = require('../../../../../database/mysql');

module.exports = {
  id: ['unmute', 'select_unmute_target'],

  /**
   * Executes either the "unmute" button to display a selection menu
   * or processes the user's selection to unmute them.
   *
   * @param {import('discord.js').Interaction} interaction - Button or user select menu interaction.
   */
  async execute(interaction) {
    const member = interaction.member;

    // Step 1: Button click → show user selector
    if (interaction.isButton()) {
      const channel = member.voice?.channel;
      if (!channel) {
        return interaction.reply({ content: 'You must be in a voice channel to unmute someone.', ephemeral: true });
      }

      const db = getDb();
      const [rows] = await db.execute(
        'SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?',
        [channel.id]
      );

      if (!rows.length || rows[0].owner_id !== member.id) {
        return interaction.reply({ content: 'Only the channel owner can unmute users.', ephemeral: true });
      }

      const mutedMembers = channel.members.filter(m => m.voice.mute);
      if (mutedMembers.size === 0) {
        return interaction.reply({ content: 'There are no muted users in your channel.', ephemeral: true });
      }

      const row = new ActionRowBuilder().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId('select_unmute_target')
          .setPlaceholder('Select a user to unmute')
          .setMinValues(1)
          .setMaxValues(1)
      );

      return interaction.reply({
        content: 'Select the user you want to unmute:',
        components: [row],
        ephemeral: true
      });
    }

    // Step 2: User selection → unmute the user
    if (interaction.isUserSelectMenu() && interaction.customId === 'select_unmute_target') {
      const userId = interaction.values[0];
      const guild = interaction.guild;
      const target = await guild.members.fetch(userId).catch(() => null);
      const channel = interaction.member.voice?.channel;

      if (!target || !channel || target.voice.channelId !== channel.id) {
        return interaction.reply({ content: 'The user is not in your voice channel.', ephemeral: true });
      }

      const db = getDb();
      const [rows] = await db.execute(
        'SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?',
        [channel.id]
      );

      if (!rows.length || rows[0].owner_id !== interaction.member.id) {
        return interaction.reply({ content: 'You do not have permission to perform this action.', ephemeral: true });
      }

      await target.voice.setMute(false);
      await interaction.deferUpdate();
      return interaction.followUp({
        content: `User **${target.user.tag}** has been unmuted.`,
        ephemeral: true
      });
    }
  }
};
