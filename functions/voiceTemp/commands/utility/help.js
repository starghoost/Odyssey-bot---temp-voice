// functions/voiceTemp/commands/utility/help.js

/**
 * Slash command that displays an embedded help menu listing all commands
 * available for managing temporary voice channels.
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help') 
    .setDescription('Displays the available commands for managing temporary voice channels.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📖 Help - Temporary Voice Channels')
      .setColor('Green')
      .setDescription('Here is a list of useful commands to manage your temporary voice channel:')
      .addFields(
        { name: '/add_user', value: 'Grants a user access to your private voice channel.' },
        { name: '/help', value: 'Displays this help menu.' },
        { name: '/ban', value: 'Blocks a user from joining your voice channel.' },
        { name: '/search', value: 'Shows what channel a user is in and allows you to join.' },
        { name: '/create_base_channel', value: 'Defines a base channel to generate temporary channels.' },
        { name: '/create_temp_channel', value: 'Creates a custom voice channel (public or private).' },
        { name: '/undeafen', value: 'Undeafens a user in your channel.' },
        { name: '/unmute', value: 'Unmutes a user in your channel.' },
        { name: '/deafen', value: 'Prevents a user from hearing others in your channel.' },
        { name: '/kick', value: 'Kicks a user from your claimed channel.' },
        { name: '/mute', value: 'Mutes a user in your channel.' },
        { name: '/private', value: 'Makes your channel private.' },
        { name: '/public', value: 'Makes your channel public.' },
        { name: '/remove_user', value: 'Revokes a user\'s access to your private channel.' },
        { name: '/claim', value: 'Claims ownership of the channel you are in.' },
        { name: '/rename', value: 'Changes the name of your channel (owner only).' },
        { name: '/setadminroles', value: 'Sets admin roles that cannot be kicked or banned.' },
        { name: '/transfer', value: 'Transfers channel ownership to another user.' }
      )
      .setFooter({ text: 'Temporary Voice Channel Bot' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
