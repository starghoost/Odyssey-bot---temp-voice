// functions/voiceTemp/commands/menu/buttons/undeafen.js

/**
 * Handles the "undeafen" button and user selection interaction.
 * Allows the owner of a temporary voice channel to undeafen a selected member.
 */

const { ActionRowBuilder, UserSelectMenuBuilder } = require('discord.js');
const { getDb } = require('../../../../../database/mysql');

module.exports = {
  id: ['undeafen', 'select_undeafen_target'],

  /**
   * Executes the undeafen button or select menu interaction.
   *
   * @param {import('discord.js').Interaction} interaction - Button or select menu interaction.
   */
  async execute(interaction) {
    const member = interaction.member;

    // Step 1: Button click → open user selection menu
    if (interaction.isButton()) {
      const channel = member.voice?.channel;
      if (!channel) {
        return interaction.reply({ content: 'You must be in a voice channel to undeafen someone.', ephemeral: true });
      }

      const db = getDb();
      const [rows] = await db.execute(
        'SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', 
        [channel.id]
      );

      if (!rows.length || rows[0].owner_id !== member.id) {
        return interaction.reply({ content: 'Only the channel owner can undeafen users.', ephemeral: true });
      }

      const deafenedMembers = channel.members.filter(m => m.voice.deaf);
      if (deafenedMembers.size === 0) {
        return interaction.reply({ content: 'There are no deafened users in your channel.', ephemeral: true });
      }

      const row = new ActionRowBuilder().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId('select_undeafen_target')
          .setPlaceholder('Select a user to allow them to listen again')
          .setMinValues(1)
          .setMaxValues(1)
      );

      return interaction.reply({
        content: 'Select the user you want to undeafen:',
        components: [row],
        ephemeral: true
      });
    }

    // Step 2: User selected from the menu → undeafen
    if (interaction.isUserSelectMenu() && interaction.customId === 'select_undeafen_target') {
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

      await target.voice.setDeaf(false);
      await interaction.deferUpdate();
      return interaction.followUp({
        content: `User **${target.user.tag}** can now hear again.`,
        ephemeral: true
      });
    }
  }
};
