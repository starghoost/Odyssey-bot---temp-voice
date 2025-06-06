// functions/voiceTemp/searchUser.js

/**
 * Slash command to locate which voice channel a user is currently connected to.
 * If the requester has access, it returns the channel info with a direct link.
 */

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  PermissionsBitField
} = require('discord.js');

const { getDb } = require('../../../../database/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search') 
    .setDescription('Find out which voice channel a user is connected to.')
    .addUserOption(option =>
      option.setName('user') 
        .setDescription('User you want to search for')
        .setRequired(true)
    ),

  name: Events.InteractionCreate,

  async execute(interaction) {
    const db = getDb();

    if (interaction.isChatInputCommand() && interaction.commandName === 'search') {
      const user = interaction.options.getUser('user');
      const member = interaction.guild.members.cache.get(user.id);
      const requester = interaction.guild.members.cache.get(interaction.user.id);

      // If user is not connected to a voice channel
      if (!member || !member.voice.channel) {
        return interaction.reply({ content: await t(interaction.guildId, '🔇 The user is not connected to any voice channel.'), ephemeral: true });
      }

      const channel = member.voice.channel;

      // Check if the requester is banned from this temp channel
      const [bans] = await db.execute(
        'SELECT * FROM channel_bans WHERE temp_channel_id = ? AND banned_user_id = ?',
        [channel.id, requester.id]
      );

      if (bans.length > 0) {
        return interaction.reply({
          content: await t(interaction.guildId, '🚫 You cannot access this channel because you have been blocked by its owner.'),
          ephemeral: true
        });
      }

      const botMember = await interaction.guild.members.fetchMe();
      const channelPermissions = channel.permissionsFor(requester);
      const canViewChannel = channelPermissions?.has(PermissionsBitField.Flags.ViewChannel);

      // If the channel is private and the user doesn't have access
      if (!canViewChannel) {
        const embed = new EmbedBuilder()
          .setTitle('🔒 Restricted Channel')
          .setColor('#ED4245')
          .setDescription(`User **${user.username}** is connected to a private channel you do not have access to.`)
          .setFooter({ text: '🔎 Temporary Channel Lookup System' });

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Build embed with channel info
      const embed = new EmbedBuilder()
        .setTitle('🔍 Voice Channel Found')
        .setColor('#5865F2')
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setDescription(`User **${user.username}** is connected to:`)
        .addFields(
          { name: '📛 Channel Name', value: channel.name, inline: true },
          { name: '🆔 Channel ID', value: channel.id, inline: true },
          { name: '👥 Connected Users', value: `${channel.members.size}`, inline: true }
        )
        .setFooter({ text: '🔎 Temporary Channel Lookup System' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Go to channel')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${interaction.guild.id}/${channel.id}`)
      );

      return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
  }
};
