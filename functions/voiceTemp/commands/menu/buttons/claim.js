// functions/voiceTemp/commands/menu/buttons/claim.js

/**
 * Handles the "claim" button interaction.
 * Allows a user to claim ownership of a temporary voice channel if it hasn't already been claimed.
 * Updates or inserts the owner data in the temp_channels table accordingly.
 */

const { getDb } = require('../../../../../database/mysql');

module.exports = {
  id: 'claim',

  /**
   * Executes the claim action for a voice channel.
   * Validates the user's presence in a voice channel, then either updates or inserts ownership into the DB.
   *
   * @param {import('discord.js').Interaction} interaction - The button interaction
   */
  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice?.channel;

    // Ensure the user is connected to a voice channel
    if (!voiceChannel) {
      return interaction.reply({ 
        content: 'You must be connected to a voice channel to claim it.', 
        ephemeral: true 
      });
    }

    const db = getDb();
    const [existing] = await db.execute(
      'SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?',
      [voiceChannel.id]
    );

    if (existing.length > 0) {
      // The user already owns this channel
      if (existing[0].owner_id === member.id) {
        return interaction.reply({ content: 'You already own this channel.', ephemeral: true });
      }

      // The channel has already been claimed by someone else
      if (existing[0].owner_id !== null) {
        return interaction.reply({ content: 'This channel has already been claimed by another user.', ephemeral: true });
      }

      // Update ownership in DB
      await db.execute(
        'UPDATE temp_channels SET owner_id = ?, owner_name = ? WHERE temp_channel_id = ?',
        [member.id, member.user.username, voiceChannel.id]
      );
    } else {
      // No record exists yet for this channel — insert it
      await db.execute(
        `INSERT INTO temp_channels 
          (temp_channel_id, base_channel_id, guild_id, owner_id, owner_name, name)
         VALUES (?, NULL, ?, ?, ?, ?)`,
        [voiceChannel.id, interaction.guild.id, member.id, member.user.username, voiceChannel.name]
      );
    }

    return interaction.reply({ 
      content: `You are now the owner of the channel **${voiceChannel.name}**.`, 
      ephemeral: true 
    });
  }
};
