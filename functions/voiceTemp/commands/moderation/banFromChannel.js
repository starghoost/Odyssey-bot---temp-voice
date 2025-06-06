// functions/voiceTemp/banFromChannel.js

/**
 * Slash command to block a user from joining the current temporary voice channel.
 * Only the channel owner can use this command.
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { t } = require('./../../../utils/translator');
const { getDb } = require('../../../../database/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Prevents a user from joining your temporary voice channel.')
    .addUserOption(option =>
      option.setName('user') 
        .setDescription('User to block')
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const userToBan = interaction.options.getUser('user'); 
    const voiceChannel = member.voice.channel;

    // Ensure the user is connected to a voice channel
    if (!voiceChannel) {
      return interaction.reply({ content: await t(interaction.guildId, 'You must be in a voice channel to use this command.'), ephemeral: true });
    }

    const db = getDb();
    const [temp] = await db.execute(
      'SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', 
      [voiceChannel.id]
    );

    // Only the owner of the temporary channel can ban
    if (!temp.length || temp[0].owner_id !== member.id) {
      return interaction.reply({ content: await t(interaction.guildId, 'Only the channel owner can use this command.'), ephemeral: true });
    }

    const memberToBan = interaction.guild.members.cache.get(userToBan.id);

    // Prevent banning administrators
    if (memberToBan?.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: await t(interaction.guildId, 'You cannot block an administrator.'), ephemeral: true });
    }

    // Prevent banning members with admin roles
    const [roles] = await db.execute(
      'SELECT role_id FROM admin_roles WHERE guild_id = ?', 
      [interaction.guild.id]
    );

    const adminRoles = roles.map(r => r.role_id);
    const hasAdminRole = memberToBan?.roles.cache.some(role => adminRoles.includes(role.id));
    if (hasAdminRole) {
      return interaction.reply({ content: await t(interaction.guildId, 'You cannot block a user with an administrative role.'), ephemeral: true });
    }

    // Add user to ban list in the database
    await db.execute(
      'INSERT IGNORE INTO channel_bans (temp_channel_id, banned_user_id) VALUES (?, ?)', 
      [voiceChannel.id, userToBan.id]
    );

    // Disconnect the banned user if they are currently in the channel
    if (memberToBan?.voice.channelId === voiceChannel.id) {
      await memberToBan.voice.disconnect();
    }

    return interaction.reply({
      content: await t(interaction.guildId, 'User **{user}** has been blocked from this channel.', { user: userToBan.tag }),
      ephemeral: true
    });
  }
};
