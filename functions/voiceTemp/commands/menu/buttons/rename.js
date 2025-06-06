// functions/voiceTemp/commands/menu/buttons/rename.js

/**
 * Handles the "rename" button and modal submission.
 * Allows the owner of a temporary voice channel to rename it using a modal input.
 */

const {ModalBuilder,TextInputBuilder,TextInputStyle,ActionRowBuilder} = require('discord.js');
const { t } = require('./../../../../utils/translator');

const { getDb } = require('../../../../../database/mysql');

module.exports = {
  id: ['rename', 'modal_rename'],

  /**
   * Executes either:
   * - the "rename" button interaction which displays the modal, or
   * - the "modal_rename" submission to update the channel name.
   *
   * @param {import('discord.js').Interaction} interaction - The interaction object from Discord
   */
  async execute(interaction) {
    const member = interaction.member;

    // Step 1: Button interaction to display modal
    if (interaction.isButton()) {
      const channel = member.voice?.channel;

      if (!channel) {
        return interaction.reply({ content: await t(interaction.guildId, 'You must be in a voice channel to rename it.'), ephemeral: true });
      }

      const db = getDb();
      const [rows] = await db.execute(
        'SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', 
        [channel.id]
      );

      if (!rows.length || rows[0].owner_id !== member.id) {
        return interaction.reply({ content: await t(interaction.guildId, 'Only the owner of the channel can rename it.'), ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId('modal_rename')
        .setTitle('Rename Voice Channel')
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('new_name')
              .setLabel('New channel name')
              .setStyle(TextInputStyle.Short)
              .setMinLength(1)
              .setMaxLength(100)
              .setPlaceholder('e.g. Juan’s Gaming Room')
              .setRequired(true)
          )
        );

      return interaction.showModal(modal);
    }

    // Step 2: Modal submission to apply the name change
    if (interaction.isModalSubmit() && interaction.customId === 'modal_rename') {
      const newName = interaction.fields.getTextInputValue('new_name');
      const guild = interaction.guild;
      const member = await guild.members.fetch(interaction.user.id);
      const channel = member.voice?.channel;

      if (!channel) {
        return interaction.reply({ content: await t(interaction.guildId, 'You must be in a voice channel to rename it.'), ephemeral: true });
      }

      const db = getDb();
      const [rows] = await db.execute(
        'SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', 
        [channel.id]
      );

      if (!rows.length || rows[0].owner_id !== member.id) {
        return interaction.reply({ content: await t(interaction.guildId, 'Only the owner of the channel can change the name.'), ephemeral: true });
      }

      try {
        await channel.setName(newName);
        await db.execute(
          'UPDATE temp_channels SET name = ? WHERE temp_channel_id = ?', 
          [newName, channel.id]
        );
        return interaction.reply({ content: await t(interaction.guildId, 'Channel renamed to **{name}**.', { name: newName }), ephemeral: true });
      } catch (error) {
        console.error('Error renaming channel:', error);
        return interaction.reply({ content: await t(interaction.guildId, 'An error occurred while renaming the channel.'), ephemeral: true });
      }
    }
  }
};

