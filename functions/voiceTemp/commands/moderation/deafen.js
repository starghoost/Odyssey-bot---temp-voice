// functions/voiceTemp/deafen.js

/**
 * Slash command to deafen a user in your temporary voice channel.
 * Prevents them from hearing others. Only the channel owner can use this command.
 */

const { SlashCommandBuilder } = require('discord.js');
const { getDb } = require('../../../../database/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deafen') 
    .setDescription('Prevents a user from hearing others in your temporary voice channel.')
    .addUserOption(option =>
      option.setName('user') 
        .setDescription('User to deafen')
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const targetUser = interaction.options.getUser('user'); 
    const channel = member.voice.channel;

    // Must be connected to a voice channel
    if (!channel) {
      return interaction.reply({ content: 'You must be in a voice channel to use this command.', ephemeral: true });
    }

    const db = getDb();
    const [row] = await db.execute(
      'SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', 
      [channel.id]
    );

    // Only the owner can execute this action
    if (!row.length || row[0].owner_id !== member.id) {
      return interaction.reply({ content: 'Only the owner of the channel can deafen users.', ephemeral: true });
    }

    const targetMember = interaction.guild.members.cache.get(targetUser.id);
    if (!targetMember || targetMember.voice.channelId !== channel.id) {
      return interaction.reply({ content: 'The user is not in your voice channel.', ephemeral: true });
    }

    await targetMember.voice.setDeaf(true);
    return interaction.reply({
      content: `User **${targetUser.tag}** has been deafened.`,
      ephemeral: true
    });
  }
};
