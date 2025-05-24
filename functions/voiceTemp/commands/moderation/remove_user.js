// functions/voiceTemp/remove_user.js

/**
 * Slash command to revoke a user's access to your private voice channel.
 * Only the owner of a private channel can perform this action.
 */

const { SlashCommandBuilder } = require('discord.js');
const { getDb } = require('../../../../database/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove_user') 
    .setDescription('Revokes a user\'s access to your private voice channel.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to remove from the channel')
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const userToRemove = interaction.options.getUser('user'); 
    const channel = member.voice?.channel;

    // Ensure user is in a voice channel
    if (!channel) {
      return interaction.reply({ content: 'You must be in a private channel to use this command.', ephemeral: true });
    }

    const db = getDb();
    const [rows] = await db.execute(
      'SELECT owner_id, privacy FROM temp_channels WHERE temp_channel_id = ?', 
      [channel.id]
    );

    // Only the owner of a private channel can remove users
    if (!rows.length || rows[0].owner_id !== member.id || rows[0].privacy !== 1) {
      return interaction.reply({ content: 'You can only remove users from a private channel that you own.', ephemeral: true });
    }

    // Remove from whitelist
    await db.execute(
      'DELETE FROM channel_whitelist WHERE temp_channel_id = ? AND user_id = ?', 
      [channel.id, userToRemove.id]
    );

    // Remove Discord permission overwrite
    try {
      await channel.permissionOverwrites.delete(userToRemove.id);
    } catch (err) {
      console.error('Error revoking user permissions:', err);
    }

    return interaction.reply({ 
      content: `User **${userToRemove.tag}** no longer has access to your channel.`, 
      ephemeral: true 
    });
  }
};
