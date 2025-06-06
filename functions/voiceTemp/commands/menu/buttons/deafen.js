// functions/voiceTemp/commands/menu/buttons/deafen.js

/**
 * Handles the "deafen" button and user selection menu.
 * Allows the owner of a temporary voice channel to deafen a selected user.
 */

const { ActionRowBuilder, UserSelectMenuBuilder } = require('discord.js');
const { t } = require('./../../../../utils/translator');
const { getDb } = require('../../../../../database/mysql');

module.exports = {
  id: ['deafen', 'select_deafen_target'],

  /**
   * Executes the deafen interaction:
   * 1. Shows the user selection menu if "deafen" button is clicked.
   * 2. Deafens the selected user if a target is selected from the menu.
   *
   * @param {import('discord.js').Interaction} interaction - The button or menu interaction
   */
  async execute(interaction) {
    const member = interaction.member;

    // Step 1: Handle button press to open user select menu
    if (interaction.isButton()) {
      const channel = member.voice?.channel;
      if (!channel) {
        return interaction.reply({ content: await t(interaction.guildId, 'You must be in a voice channel to use this option.'), ephemeral: true });
      }

      const db = getDb();
      const [rows] = await db.execute('SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', [channel.id]);

      if (!rows.length || rows[0].owner_id !== member.id) {
        return interaction.reply({ content: await t(interaction.guildId, 'Only the channel owner can deafen users.'), ephemeral: true });
      }

      const row = new ActionRowBuilder().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId('select_deafen_target')
          .setPlaceholder('Select a user to deafen')
          .setMinValues(1)
          .setMaxValues(1)
      );

      return interaction.reply({ 
        content: await t(interaction.guildId, 'Select the user you want to deafen:'), 
        components: [row], 
        ephemeral: true 
      });
    }

    // Step 2: Handle user selection from the menu
    if (interaction.isUserSelectMenu() && interaction.customId === 'select_deafen_target') {
      const userId = interaction.values[0];
      const guild = interaction.guild;
      const target = await guild.members.fetch(userId).catch(() => null);
      const channel = interaction.member.voice?.channel;

      // Validate that the target is in the same voice channel
      if (!target || !channel || target.voice.channelId !== channel.id) {
        return interaction.reply({ content: await t(interaction.guildId, 'The user is not in your voice channel.'), ephemeral: true });
      }

      const db = getDb();
      const [rows] = await db.execute('SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', [channel.id]);
      if (!rows.length || rows[0].owner_id !== interaction.member.id) {
        return interaction.reply({ content: await t(interaction.guildId, 'You do not have permission to perform this action.'), ephemeral: true });
      }

      await target.voice.setDeaf(true);
      await interaction.deferUpdate();
      return interaction.followUp({
        content: await t(interaction.guildId, 'User **{user}** has been deafened.', { user: target.user.tag }),
        ephemeral: true
      });
    }
  }
};
