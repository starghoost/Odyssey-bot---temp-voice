// functions/voiceTemp/renameChannel.js

/**
 * Slash command to rename a claimed temporary voice channel.
 * Only the current owner of the voice channel can execute this action.
 */

const { SlashCommandBuilder } = require('discord.js');
const { getDb } = require('../../../../database/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rename')
    .setDescription('Renames your claimed temporary voice channel.')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('New name for the channel')
        .setRequired(true)),

  /**
   * Executes the /rename command.
   * Validates that the user is inside a voice channel and is its owner,
   * then updates the name both on Discord and in the database.
   *
   * @param {import('discord.js').ChatInputCommandInteraction} interaction - The slash command interaction
   */
  async execute(interaction) {
    const member = interaction.member;
    const voiceChannel = member.voice.channel;
    const newName = interaction.options.getString('name');

    // The user must be in a voice channel to rename it
    if (!voiceChannel) {
      return interaction.reply({ 
        content: 'You must be in a voice channel to use this command.', 
        ephemeral: true 
      });
    }

    const db = getDb();
    const [result] = await db.execute(
      'SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', 
      [voiceChannel.id]
    );

    // Only the channel owner can rename it
    if (!result.length || result[0].owner_id !== member.id) {
      return interaction.reply({ 
        content: 'Only the owner of the channel can rename it.', 
        ephemeral: true 
      });
    }

    // Update the name on Discord
    await voiceChannel.setName(newName);

    // Update the name in the database
    await db.execute(
      'UPDATE temp_channels SET name = ? WHERE temp_channel_id = ?', 
      [newName, voiceChannel.id]
    );

    return interaction.reply({
      content: await t(interaction.guildId, 'Channel renamed to **{name}**.', { name: newName }),
      ephemeral: true
    });
  }
};
