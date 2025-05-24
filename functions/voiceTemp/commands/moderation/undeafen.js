// functions/voiceTemp/undeafen.js

/**
 * Slash command to undeafen a user in your temporary voice channel.
 * Only the owner of the voice channel can perform this action.
 */

const { SlashCommandBuilder } = require('discord.js');
const { getDb } = require('../../../../database/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('undeafen') 
    .setDescription('Allows a user to hear again in your temporary voice channel.')
    .addUserOption(option =>
      option.setName('user') 
        .setDescription('User to allow to hear again')
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const targetUser = interaction.options.getUser('user'); 
    const channel = member.voice.channel;

    // User must be connected to a voice channel
    if (!channel) {
      return interaction.reply({ content: 'You must be in a voice channel to use this command.', ephemeral: true });
    }

    const db = getDb();
    const [row] = await db.execute(
      'SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', 
      [channel.id]
    );

    // Check if the user is the owner of the channel
    if (!row.length || row[0].owner_id !== member.id) {
      return interaction.reply({ content: 'Only the owner of the channel can undeafen a user.', ephemeral: true });
    }

    const targetMember = interaction.guild.members.cache.get(targetUser.id);

    // Validate the target is in the same voice channel
    if (!targetMember || targetMember.voice.channelId !== channel.id) {
      return interaction.reply({ content: 'The user is not in your voice channel.', ephemeral: true });
    }

    await targetMember.voice.setDeaf(false);
    return interaction.reply({
      content: `User **${targetUser.tag}** can now hear again.`,
      ephemeral: true
    });
  }
};
