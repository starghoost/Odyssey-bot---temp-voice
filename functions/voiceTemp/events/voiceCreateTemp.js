// functions/voiceTemp/events/voiceCreateTemp.js

/**
 * Event listener that creates a new temporary voice channel when a user joins a predefined base channel.
 * Automatically moves the user to the newly created channel.
 */

const { Events, ChannelType, PermissionFlagsBits } = require('discord.js');
const { getDb } = require('../../../database/mysql');

module.exports = {
  name: Events.VoiceStateUpdate,

  /**
   * Executes when a user's voice state changes.
   * If they join a base channel, a temporary channel is created for them and they are moved into it.
   *
   * @param {import('discord.js').VoiceState} oldState - The user's previous voice state.
   * @param {import('discord.js').VoiceState} newState - The user's current voice state.
   */
  async execute(oldState, newState) {
    // Ignore if the channel didn't change or was left
    if (!newState.channelId || newState.channelId === oldState.channelId) return;

    const db = getDb();

    // Check if the joined channel is a base channel
    const [baseChannel] = await db.execute(
      'SELECT * FROM base_channels WHERE channel_id = ?', 
      [newState.channelId]
    );

    if (baseChannel.length === 0) return;

    const base = baseChannel[0];
    const guild = newState.guild;
    const member = newState.member;
    const category = newState.channel.parent;

    // Create the temporary voice channel
    const newChannel = await guild.channels.create({
      name: `${member.user.username}`,
      type: ChannelType.GuildVoice,
      parent: category?.id,
      userLimit: base.user_limit,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel]
        }
        // No special permissions granted to the creator by default
      ]
    });

    // Register the temporary channel in the database
    await db.execute(
      'INSERT INTO temp_channels (temp_channel_id, base_channel_id, guild_id, owner_id, owner_name, name, user_limit) VALUES (?, ?, ?, NULL, NULL, ?, ?)',
      [newChannel.id, base.channel_id, guild.id, newChannel.name, base.user_limit]
    );

    // Move the member to the new temporary channel
    await member.voice.setChannel(newChannel).catch(console.error);
  }
};
