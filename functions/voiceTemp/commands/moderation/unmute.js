// functions/voiceTemp/unmute.js

/**
 * Slash command to unmute a user in your temporary voice channel.
 * Only the channel owner can perform this action.
 */

const { SlashCommandBuilder } = require('discord.js');
const { t } = require('./../../../utils/translator');
const { getDb } = require('../../../../database/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute') 
    .setDescription('Unmutes a user in your temporary voice channel.')
    .addUserOption(option =>
      option.setName('user') 
        .setDescription('User you want to unmute')
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const targetUser = interaction.options.getUser('user'); 
    const channel = member.voice.channel;

    // User must be connected to a voice channel
    if (!channel) {
      return interaction.reply({ content: await t(interaction.guildId, 'You must be in a voice channel to use this command.'), ephemeral: true });
    }

    const db = getDb();
    const [row] = await db.execute(
      'SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', 
      [channel.id]
    );

    // Only the owner can unmute users
    if (!row.length || row[0].owner_id !== member.id) {
      return interaction.reply({ content: await t(interaction.guildId, 'Only the owner of the channel can unmute users.'), ephemeral: true });
    }

    const targetMember = interaction.guild.members.cache.get(targetUser.id);
    if (!targetMember || targetMember.voice.channelId !== channel.id) {
      return interaction.reply({ content: await t(interaction.guildId, 'The user is not in your voice channel.'), ephemeral: true });
    }

    await targetMember.voice.setMute(false);
    return interaction.reply({
      content: await t(interaction.guildId, 'User **{user}** can now speak again.', { user: targetUser.tag }),
      ephemeral: true
    });
  }
};
