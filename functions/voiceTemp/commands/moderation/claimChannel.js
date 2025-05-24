// functions/voiceTemp/commands/moderation/claimChannel.js

/**
 * Slash command to claim ownership of the voice channel the user is currently connected to.
 * If the channel is already claimed by another user, it will deny the request.
 */

const { SlashCommandBuilder } = require('discord.js');
const { getDb } = require('../../../../database/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Claims ownership of the voice channel you are currently connected to.'),

  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    // Ensure the user is connected to a voice channel
    if (!voiceChannel) {
      return interaction.reply({ content: 'You must be connected to a voice channel to claim it.', ephemeral: true });
    }

    const db = getDb();

    const [existing] = await db.execute(
      'SELECT * FROM temp_channels WHERE temp_channel_id = ?', 
      [voiceChannel.id]
    );

    // If the channel already exists in the database
    if (existing.length > 0) {
      const ownerId = existing[0].owner_id;

      // Already the owner
      if (ownerId === member.id) {
        return interaction.reply({ content: 'You already own this channel.', ephemeral: true });
      }

      // Already claimed by someone else
      if (ownerId !== null) {
        return interaction.reply({ content: 'This channel has already been claimed by another user.', ephemeral: true });
      }

      // Claim it
      await db.execute(
        'UPDATE temp_channels SET owner_id = ?, owner_name = ? WHERE temp_channel_id = ?',
        [member.id, member.user.username, voiceChannel.id]
      );

      return interaction.reply({ content: `You are now the owner of **${voiceChannel.name}**.`, ephemeral: true });
    }

    // Insert a new entry if the channel isn't tracked yet
    await db.execute(
      `INSERT INTO temp_channels 
        (temp_channel_id, base_channel_id, guild_id, owner_id, owner_name, name) 
       VALUES (?, NULL, ?, ?, ?, ?)`,
      [voiceChannel.id, interaction.guild.id, member.id, member.user.username, voiceChannel.name]
    );

    return interaction.reply({ content: `You are now the owner of **${voiceChannel.name}**.`, ephemeral: true });
  }
};
