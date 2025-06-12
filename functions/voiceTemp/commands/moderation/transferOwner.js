// functions/voiceTemp/transferOwner.js

/**
 * Slash command to transfer ownership of your temporary voice channel to another user.
 * The new owner receives channel permissions, and the current owner's permissions are removed.
 */

const { SlashCommandBuilder } = require('discord.js');
const { t } = require('./../../../utils/translator');
const { getDb } = require('../../../../database/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('transfer') 
    .setDescription('Transfers ownership of your temporary voice channel to another user.')
    .addUserOption(option =>
      option.setName('user') 
        .setDescription('New owner of the channel')
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const newOwner = interaction.options.getUser('user'); 
    const channel = member.voice.channel;

    // Must be connected to a voice channel
    if (!channel) {
      return interaction.reply({ content: await t(interaction.guildId, 'You must be in a voice channel to transfer ownership.'), ephemeral: true });
    }

    const db = getDb();
    const [result] = await db.execute(
      'SELECT owner_id FROM temp_channels WHERE temp_channel_id = ?', 
      [channel.id]
    );

    // Only the current owner can transfer ownership
    if (!result.length || result[0].owner_id !== member.id) {
      return interaction.reply({ content: await t(interaction.guildId, 'Only the channel owner can transfer ownership.'), ephemeral: true });
    }

    // Update the database record
    await db.execute(
      'UPDATE temp_channels SET owner_id = ?, owner_name = ? WHERE temp_channel_id = ?', 
      [newOwner.id, newOwner.username, channel.id]
    );

    // Grant channel permissions to the new owner
    await channel.permissionOverwrites.edit(newOwner.id, {
      Connect: true,
      MuteMembers: true,
      DeafenMembers: true,
      MoveMembers: true
    });

    // Remove previous owner's permissions
    await channel.permissionOverwrites.delete(member.id);

    return interaction.reply({
      content: await t(interaction.guildId, 'You have transferred ownership of the channel to **{user}**.', { user: newOwner.tag }),
      ephemeral: true
    });
  }
};
