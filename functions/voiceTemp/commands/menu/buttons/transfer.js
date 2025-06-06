// functions/voiceTemp/commands/menu/buttons/transfer.js

/**
 * Handles the "transfer" button and user select interaction.
 * Allows the owner of a temporary voice channel to transfer ownership to another member.
 */

const { ActionRowBuilder, UserSelectMenuBuilder } = require('discord.js');
const { t } = require('./../../../../utils/translator');
const { getDb } = require('../../../../../database/mysql');

module.exports = {
  id: ['transfer', 'select_transfer_target'],

  /**
   * Executes either:
   * - the "transfer" button to open the user select menu
   * - the user selection to apply the ownership transfer
   *
   * @param {import('discord.js').Interaction} interaction
   */
  async execute(interaction) {
    const member = interaction.member;

    // Step 1: Button interaction → open user selection menu
    if (interaction.isButton()) {
      const channel = member.voice?.channel;
      if (!channel) {
        return interaction.reply({ content: await t(interaction.guildId, 'You must be in a voice channel to transfer it.'), ephemeral: true });
      }

      const db = getDb();
      const [rows] = await db.execute('SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', [channel.id]);
      if (!rows.length || rows[0].owner_id !== member.id) {
        return interaction.reply({ content: await t(interaction.guildId, 'Only the owner can transfer the channel.'), ephemeral: true });
      }

      const row = new ActionRowBuilder().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId('select_transfer_target')
          .setPlaceholder('Select the new owner')
          .setMinValues(1)
          .setMaxValues(1)
      );

      return interaction.reply({
        content: await t(interaction.guildId, 'Select the new owner of the channel:'),
        components: [row],
        ephemeral: true
      });
    }

    // Step 2: User selected → perform transfer
    if (interaction.isUserSelectMenu() && interaction.customId === 'select_transfer_target') {
      const newOwnerId = interaction.values[0];
      const guild = interaction.guild;
      const newOwner = await guild.members.fetch(newOwnerId).catch(() => null);
      const member = await guild.members.fetch(interaction.user.id);
      const channel = member.voice?.channel;

      if (!channel || !newOwner) {
        return interaction.reply({ content: await t(interaction.guildId, 'Invalid user or unavailable channel.'), ephemeral: true });
      }

      const db = getDb();
      const [rows] = await db.execute('SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', [channel.id]);
      if (!rows.length || rows[0].owner_id !== member.id) {
        return interaction.reply({ content: await t(interaction.guildId, 'You do not have permission to transfer this channel.'), ephemeral: true });
      }

      try {
        await db.execute(
          'UPDATE temp_channels SET owner_id = ?, owner_name = ? WHERE temp_channel_id = ?',
          [newOwner.id, newOwner.user.username, channel.id]
        );

        await channel.permissionOverwrites.edit(newOwner.id, {
          Connect: true,
          MuteMembers: true,
          DeafenMembers: true,
          MoveMembers: true
        });

        await channel.permissionOverwrites.delete(member.id);

        await interaction.deferUpdate();
        return interaction.followUp({
          content: await t(interaction.guildId, 'You have transferred ownership of the channel to **{user}**.', { user: newOwner.user.tag }),
          ephemeral: true
        });
      } catch (error) {
        console.error('Error transferring channel:', error);
        return interaction.reply({ content: await t(interaction.guildId, 'An error occurred while transferring channel ownership.'), ephemeral: true });
      }
    }
  }
};

