// functions/voiceTemp/commands/menu/buttons/mute.js

/**
 * Handles the "mute" button and user selection interaction.
 * Allows the owner of a temporary voice channel to mute a selected user.
 */

const { ActionRowBuilder, UserSelectMenuBuilder } = require('discord.js');
const { getDb } = require('../../../../../database/mysql');

module.exports = {
  id: ['mute', 'select_mute_target'],

  /**
   * Executes the mute interaction.
   * Displays a user selector when the button is clicked, and mutes the selected user upon confirmation.
   *
   * @param {import('discord.js').Interaction} interaction - The button or select menu interaction
   */
  async execute(interaction) {
    const member = interaction.member;

    // Step 1: Handle button click to show user selection menu
    if (interaction.isButton()) {
      const channel = member.voice?.channel;
      if (!channel) {
        return interaction.reply({ content: 'You must be in a voice channel to mute someone.', ephemeral: true });
      }

      const db = getDb();
      const [rows] = await db.execute(
        'SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', 
        [channel.id]
      );

      if (!rows.length || rows[0].owner_id !== member.id) {
        return interaction.reply({ content: 'Only the owner of the channel can mute users.', ephemeral: true });
      }

      const row = new ActionRowBuilder().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId('select_mute_target')
          .setPlaceholder('Select a user to mute')
          .setMinValues(1)
          .setMaxValues(1)
      );

      return interaction.reply({ 
        content: 'Select the user you want to mute:', 
        components: [row], 
        ephemeral: true 
      });
    }

    // Step 2: Handle user selection and mute the target
    if (interaction.isUserSelectMenu() && interaction.customId === 'select_mute_target') {
      const userId = interaction.values[0];
      const guild = interaction.guild;
      const target = await guild.members.fetch(userId).catch(() => null);
      const member = await guild.members.fetch(interaction.user.id);
      const channel = member.voice?.channel;

      // Validate target and presence in same voice channel
      if (!target || !channel || target.voice.channelId !== channel.id) {
        return interaction.reply({ content: 'The user is not in your voice channel.', ephemeral: true });
      }

      const db = getDb();
      const [rows] = await db.execute(
        'SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', 
        [channel.id]
      );

      if (!rows.length || rows[0].owner_id !== member.id) {
        return interaction.reply({ content: 'You do not have permission to perform this action.', ephemeral: true });
      }

      await target.voice.setMute(true);
      await interaction.deferUpdate();
      return interaction.followUp({ 
        content: `User **${target.user.tag}** has been muted.`, 
        ephemeral: true 
      });
    }
  }
};
