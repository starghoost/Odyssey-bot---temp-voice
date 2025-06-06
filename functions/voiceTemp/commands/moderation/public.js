// functions/voiceTemp/public.js

/**
 * Slash command to convert your temporary voice channel into a public one.
 * Only the owner of the channel can use this command.
 */

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { t } = require('./../../../utils/translator');
const { getDb } = require('../../../../database/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('public') 
    .setDescription('Converts your temporary voice channel to public.'),

  async execute(interaction) {
    const member = interaction.member;
    const channel = member.voice?.channel;

    // User must be in a voice channel
    if (!channel) {
      return interaction.reply({ content: await t(interaction.guildId, 'You must be in a temporary voice channel to use this command.'), ephemeral: true });
    }

    const db = getDb();
    const [rows] = await db.execute(
      'SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', 
      [channel.id]
    );

    // Only the owner can change channel visibility
    if (!rows.length || rows[0].owner_id !== member.id) {
      return interaction.reply({ content: await t(interaction.guildId, 'Only the owner of the channel can change its visibility.'), ephemeral: true });
    }

    // Update database to mark the channel as public
    await db.execute(
      'UPDATE temp_channels SET privacy = 0 WHERE temp_channel_id = ?', 
      [channel.id]
    );

    // Update Discord permissions to allow everyone access
    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        Connect: true,
        ViewChannel: true
      });
    } catch (err) {
      console.error('Error updating channel permissions:', err);
    }

    return interaction.reply({
      content: await t(interaction.guildId, 'The channel **{name}** is now public.', { name: channel.name }),
      ephemeral: true
    });
  }
};
