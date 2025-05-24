// functions/voiceTemp/autoDeleteChannel.js

/**
 * Event listener that monitors when users leave voice channels.
 * If a temporary voice channel becomes empty, it will be deleted after a short delay.
 */

const { Events } = require('discord.js');
const { getDb } = require('../../../database/mysql');

module.exports = {
  name: Events.VoiceStateUpdate,

  /**
   * Executes on every voice state change in the server.
   * Deletes the temporary channel from both Discord and the database if it becomes empty.
   *
   * @param {import('discord.js').VoiceState} oldState - The user's previous voice state.
   * @param {import('discord.js').VoiceState} newState - The user's current voice state.
   */
  async execute(oldState, newState) {
    const db = getDb();

    // Check if the user left a voice channel
    const channel = oldState.channel;
    if (!channel || channel.members.size > 0) return;

    // Verify if this channel is registered as a temporary channel
    const [result] = await db.execute(
      'SELECT * FROM temp_channels WHERE temp_channel_id = ?', 
      [channel.id]
    );

    if (result.length === 0) return;

    // Wait 10 seconds before deletion to avoid accidental closure
    setTimeout(async () => {
      if (channel.members.size === 0) {
        await db.execute(
          'DELETE FROM temp_channels WHERE temp_channel_id = ?', 
          [channel.id]
        );
        await channel.delete().catch(console.error);
      }
    }, 10000);
  }
};
