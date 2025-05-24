// functions/voiceTemp/private.js

/**
 * Slash command that turns your temporary voice channel into a private one.
 * Only the channel owner can perform this action.
 */

const { SlashCommandBuilder } = require('discord.js');
const { getDb } = require('../../../../database/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('private') 
    .setDescription('Converts your temporary voice channel to private.'),

  async execute(interaction) {
    const member = interaction.member;
    const channel = member.voice?.channel;

    // Must be in a temporary voice channel
    if (!channel) {
      return interaction.reply({ content: 'You must be in a temporary channel to use this command.', ephemeral: true });
    }

    const db = getDb();
    const [rows] = await db.execute(
      'SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', 
      [channel.id]
    );

    // Only the owner can make the channel private
    if (!rows.length || rows[0].owner_id !== member.id) {
      return interaction.reply({ content: 'Only the owner of the channel can change its visibility.', ephemeral: true });
    }

    // Update database privacy flag
    await db.execute(
      'UPDATE temp_channels SET privacy = 1 WHERE temp_channel_id = ?', 
      [channel.id]
    );

    // Update channel permissions on Discord
    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        Connect: false,
        ViewChannel: false
      });

      await channel.permissionOverwrites.edit(member.id, {
        Connect: true,
        ViewChannel: true
      });
    } catch (err) {
      console.error('Error updating channel permissions:', err);
    }

    return interaction.reply({ 
      content: `The channel **${channel.name}** is now private.`, 
      ephemeral: true 
    });
  }
};
