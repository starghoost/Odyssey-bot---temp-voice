// functions/voiceTemp/add_user.js

/**
 * Slash command to add a user to your private voice channel.
 * Only the owner of a private temporary channel can grant access.
 */

const { SlashCommandBuilder } = require('discord.js');
const { t } = require('./../../../utils/translator');
const { getDb } = require('../../../../database/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add_user') 
    .setDescription('Adds a user to your private voice channel.')
    .addUserOption(option =>
      option.setName('user') 
        .setDescription('User to allow in the channel')
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const userToAdd = interaction.options.getUser('user'); 
    const channel = member.voice?.channel;

    if (!channel) {
      return interaction.reply({ content: await t(interaction.guildId, 'You must be in a private voice channel to use this command.'), ephemeral: true });
    }

    const db = getDb();
    const [rows] = await db.execute(
      'SELECT owner_id, privacy FROM temp_channels WHERE temp_channel_id = ?',
      [channel.id]
    );

    if (!rows.length || rows[0].owner_id !== member.id || rows[0].privacy !== 1) {
      return interaction.reply({ content: await t(interaction.guildId, 'You can only add users to a private channel that you own.'), ephemeral: true });
    }

    await db.execute(
      'REPLACE INTO channel_whitelist (temp_channel_id, user_id) VALUES (?, ?)',
      [channel.id, userToAdd.id]
    );

    try {
      await channel.permissionOverwrites.edit(userToAdd.id, {
        Connect: true,
        ViewChannel: true
      });
    } catch (err) {
      console.error('Error granting permissions to the user:', err);
    }

    return interaction.reply({
      content: await t(interaction.guildId, 'User **{user}** can now join your channel.', { user: userToAdd.tag }),
      ephemeral: true
    });
  }
};
