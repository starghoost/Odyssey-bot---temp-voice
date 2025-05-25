// functions/voiceTemp/kickFromChannel.js

/**
 * Slash command to kick a user from your temporary voice channel.
 * Only the owner of the channel can use this command.
 * The command verifies that the target user is not an admin or has an admin role.
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getDb } = require('../../../../database/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicks a user from your temporary voice channel.')
    .addUserOption(option =>
      option.setName('user') 
        .setDescription('User to kick')
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const userToKick = interaction.options.getUser('user'); 
    const voiceChannel = member.voice.channel;

    // Check if user is in a voice channel
    if (!voiceChannel) {
      return interaction.reply({ content: 'You must be connected to a voice channel.', ephemeral: true });
    }

    const db = getDb();
    const [temp] = await db.execute(
      'SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', 
      [voiceChannel.id]
    );

    // Only the owner can kick users
    if (!temp.length || temp[0].owner_id !== member.id) {
      return interaction.reply({ content: 'Only the owner of the channel can use this command.', ephemeral: true });
    }

    const memberToKick = interaction.guild.members.cache.get(userToKick.id);

    // Check that the user is in the same voice channel
    if (!memberToKick || memberToKick.voice.channelId !== voiceChannel.id) {
      return interaction.reply({ content: 'The user is not in your voice channel.', ephemeral: true });
    }

    // Check if the user has admin permissions or admin role
    if (memberToKick.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You cannot kick an administrator.', ephemeral: true });
    }

    const [roles] = await db.execute(
      'SELECT role_id FROM admin_roles WHERE guild_id = ?', 
      [interaction.guild.id]
    );

    const adminRoles = roles.map(r => r.role_id);
    const hasAdminRole = memberToKick.roles.cache.some(role => adminRoles.includes(role.id));

    if (hasAdminRole) {
      return interaction.reply({ content: 'You cannot kick a user with an administrative role.', ephemeral: true });
    }

    // Disconnect the user
    await memberToKick.voice.disconnect();

    return interaction.reply({ 
      content: `User **${userToKick.tag}** has been kicked from the channel.`, 
      ephemeral: true 
    });
  }
};
