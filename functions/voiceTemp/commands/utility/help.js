// functions/voiceTemp/commands/utility/help.js

/**
 * Slash command that displays an embedded help menu listing all commands
 * available for managing temporary voice channels.
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { t } = require('../../../utils/translator');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help') 
    .setDescription('Displays the available commands for managing temporary voice channels.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle(await t(interaction.guildId, '📖 Help - Temporary Voice Channels'))
      .setColor('Green')
      .setDescription(await t(interaction.guildId, 'Here is a list of useful commands to manage your temporary voice channel:'))
      .addFields(
        { name: '/add_user', value: await t(interaction.guildId, 'Grants a user access to your private voice channel.') },
        { name: '/help', value: await t(interaction.guildId, 'Displays this help menu.') },
        { name: '/ban', value: await t(interaction.guildId, 'Blocks a user from joining your voice channel.') },
        { name: '/search', value: await t(interaction.guildId, 'Shows what channel a user is in and allows you to join.') },
        { name: '/create_base_channel', value: await t(interaction.guildId, 'Defines a base channel to generate temporary channels.') },
        { name: '/create_temp_channel', value: await t(interaction.guildId, 'Creates a custom voice channel (public or private).') },
        { name: '/undeafen', value: await t(interaction.guildId, 'Undeafens a user in your channel.') },
        { name: '/unmute', value: await t(interaction.guildId, 'Unmutes a user in your channel.') },
        { name: '/deafen', value: await t(interaction.guildId, 'Prevents a user from hearing others in your channel.') },
        { name: '/kick', value: await t(interaction.guildId, 'Kicks a user from your claimed channel.') },
        { name: '/mute', value: await t(interaction.guildId, 'Mutes a user in your channel.') },
        { name: '/private', value: await t(interaction.guildId, 'Makes your channel private.') },
        { name: '/public', value: await t(interaction.guildId, 'Makes your channel public.') },
        { name: '/remove_user', value: await t(interaction.guildId, "Revokes a user's access to your private channel.") },
        { name: '/claim', value: await t(interaction.guildId, 'Claims ownership of the channel you are in.') },
        { name: '/rename', value: await t(interaction.guildId, 'Changes the name of your channel (owner only).') },
        { name: '/setadminroles', value: await t(interaction.guildId, 'Sets admin roles that cannot be kicked or banned.') },
        { name: '/transfer', value: await t(interaction.guildId, 'Transfers channel ownership to another user.') }
      )
      .setFooter({ text: await t(interaction.guildId, 'Temporary Voice Channel Bot') });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
