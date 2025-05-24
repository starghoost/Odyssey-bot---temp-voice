// functions/voiceTemp/commands/menu/buttons/searchUser.js

/**
 * Handles the "search_user" button and user selection menu.
 * Allows a user to locate another member's current voice channel,
 * showing details if the requester is allowed to view it.
 */

const { UserSelectMenuBuilder,ActionRowBuilder,EmbedBuilder,ButtonBuilder,ButtonStyle,PermissionsBitField} = require('discord.js');

const { getDb } = require('../../../../../database/mysql');

module.exports = {
  id: ['search_user', 'select_user_channel'],

  /**
   * Executes either the user selection menu or button press.
   * Returns the target user's channel info if accessible.
   *
   * @param {import('discord.js').Interaction} interaction - The button or select menu interaction
   */
  async execute(interaction) {
    const db = getDb();

    // Step 1: Button clicked, show the user selector
    if (interaction.isButton()) {
      const row = new ActionRowBuilder().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId('select_user_channel')
          .setPlaceholder('Select a user to locate')
          .setMinValues(1)
          .setMaxValues(1)
      );

      return interaction.reply({
        content: 'Select the user you want to locate:',
        components: [row],
        ephemeral: true
      });
    }

    // Step 2: User selection submitted
    if (interaction.isUserSelectMenu() && interaction.customId === 'select_user_channel') {
      const userId = interaction.values[0];
      const guild = interaction.guild;
      const user = await guild.members.fetch(userId).catch(() => null);
      const requester = interaction.member;

      if (!user || !user.voice.channel) {
        return interaction.reply({
          content: `🔇 The user is not connected to any voice channel.`,
          ephemeral: true
        });
      }

      const channel = user.voice.channel;

      // Check if the requester is banned from the channel
      const [bans] = await db.execute(
        'SELECT * FROM channel_bans WHERE temp_channel_id = ? AND banned_user_id = ?',
        [channel.id, requester.id]
      );

      if (bans.length > 0) {
        return interaction.reply({
          content: '🚫 You cannot access this channel because you have been blocked by its owner.',
          ephemeral: true
        });
      }

      // Check if the user has permission to view the channel
      const permissions = channel.permissionsFor(requester);
      const canViewChannel = permissions?.has(PermissionsBitField.Flags.ViewChannel);

      if (!canViewChannel) {
        const embed = new EmbedBuilder()
          .setTitle('🔒 Restricted Channel')
          .setColor('#ED4245')
          .setDescription(`User **${user.user.username}** is in a private channel you do not have access to.`)
          .setFooter({ text: '🔎 Temporary Channel Search System' });

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Build embed with channel info
      const embed = new EmbedBuilder()
        .setTitle('🔍 Voice Channel Found')
        .setColor('#5865F2')
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setDescription(`User **${user.user.username}** is currently connected to:`)
        .addFields(
          { name: '📛 Channel Name', value: channel.name, inline: true },
          { name: '🆔 Channel ID', value: channel.id, inline: true },
          { name: '👥 Connected Users', value: `${channel.members.size}`, inline: true }
        )
        .setFooter({ text: '🔎 Temporary Channel Search System' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Go to Channel')
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${guild.id}/${channel.id}`)
      );

      return interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: true
      });
    }
  }
};
