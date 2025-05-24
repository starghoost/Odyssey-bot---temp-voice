// functions/voiceTemp/activeChannels.js

/**
 * Slash command that displays all currently active temporary voice channels.
 * Only accessible to server administrators or users with admin roles from the database.
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getDb } = require('../../../database/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('active_channels') // ✅ translated command name
    .setDescription('Displays a list of active temporary voice channels (admins only).'),

  async execute(interaction) {
    const member = interaction.member;
    const db = getDb();

    // Verify if user is an administrator or has admin role from DB
    if (!member.permissions.has('Administrator')) {
      const [roles] = await db.execute(
        'SELECT role_id FROM admin_roles WHERE guild_id = ?', 
        [interaction.guild.id]
      );

      const adminRoleIDs = roles.map(r => r.role_id);
      const hasAdminRole = member.roles.cache.some(role => adminRoleIDs.includes(role.id));

      if (!hasAdminRole) {
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      }
    }

    // Get all active temporary channels for the current guild
    const [channels] = await db.execute(
      'SELECT * FROM temp_channels WHERE guild_id = ?', 
      [interaction.guild.id]
    );

    if (channels.length === 0) {
      return interaction.reply({ content: 'There are currently no active temporary channels.', ephemeral: true });
    }

    // Build the response embed
    const embed = new EmbedBuilder()
      .setTitle('Active Temporary Channels')
      .setColor('DarkBlue')
      .setFooter({ text: `Total: ${channels.length} active channels` });

    for (const ch of channels) {
      const channel = interaction.guild.channels.cache.get(ch.temp_channel_id);
      if (channel) {
        embed.addFields({
          name: `${channel.name} (${channel.id})`,
          value: `👤 Owner: ${ch.owner_name}\n🔊 Connected users: ${channel.members.size}`,
          inline: false
        });
      }
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
