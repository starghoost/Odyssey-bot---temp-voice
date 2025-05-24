// functions/voiceTemp/voiceBanGuard.js

/**
 * Event listener that prevents users who are banned from a temporary channel from joining it.
 * Automatically disconnects them and sends a DM explaining the reason.
 */

const { Events } = require('discord.js');
const { getDb } = require('../../../database/mysql');

module.exports = {
  name: Events.VoiceStateUpdate,

  /**
   * Executes when a user's voice state changes.
   * If the user joins a new channel and is banned from it, they are immediately disconnected.
   *
   * @param {import('discord.js').VoiceState} oldState - The previous voice state of the user.
   * @param {import('discord.js').VoiceState} newState - The current voice state of the user.
   */
  async execute(oldState, newState) {
    // Skip if not joining a new channel
    if (!newState.channelId || oldState.channelId === newState.channelId) return;

    const db = getDb();
    const userId = newState.id;
    const channelId = newState.channelId;

    // Check if the user is banned from the channel
    const [bans] = await db.execute(
      'SELECT * FROM channel_bans WHERE temp_channel_id = ? AND banned_user_id = ?',
      [channelId, userId]
    );

    if (bans.length > 0) {
      try {
        await newState.disconnect();

        const user = await newState.guild.members.fetch(userId);
        await user.send('🚫 You have been automatically removed from a temporary channel because you are banned by the owner.');

        console.log(`[BAN GUARD] User ${userId} was kicked from channel ${channelId}`);
      } catch (err) {
        console.error(`[BAN GUARD] Failed to disconnect banned user:`, err);
      }
    }
  }
};
