// functions/voiceTemp/commands/menu/buttons/privacyToggle.js

/**
 * Handles the "privacy_toggle" button.
 * Allows the owner of a temporary voice channel to switch between public and private visibility.
 * Updates both the database and Discord permission overwrites accordingly.
 */

const { getDb } = require('../../../../../database/mysql');
const { t } = require('./../../../../utils/translator');

module.exports = {
  id: 'privacy_toggle',

  /**
   * Executes the toggle action for voice channel privacy.
   *
   * @param {import('discord.js').Interaction} interaction - The button interaction
   */
  async execute(interaction) {
    const member = interaction.member;
    const channel = member.voice?.channel;

    if (!channel) {
      return interaction.reply({ content: await t(interaction.guildId, 'You must be in a voice channel to use this feature.'), ephemeral: true });
    }

    const db = getDb();
    const [rows] = await db.execute(
      'SELECT owner_id, privacy FROM temp_channels WHERE temp_channel_id = ?',
      [channel.id]
    );

    if (!rows.length || rows[0].owner_id !== member.id) {
      return interaction.reply({ content: await t(interaction.guildId, 'Only the owner of the channel can change its privacy settings.'), ephemeral: true });
    }

    const isPrivate = rows[0].privacy === 1;
    const newPrivacy = isPrivate ? 0 : 1;

    // Update privacy state in the database
    await db.execute(
      'UPDATE temp_channels SET privacy = ? WHERE temp_channel_id = ?',
      [newPrivacy, channel.id]
    );

    try {
      if (newPrivacy === 1) {
        // Make the channel private
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
          Connect: false,
          ViewChannel: false
        });

        await channel.permissionOverwrites.edit(member.id, {
          Connect: true,
          ViewChannel: true
        });
      } else {
        // Make the channel public
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
          Connect: true,
          ViewChannel: true
        });
      }
    } catch (err) {
      console.error('Error updating channel permissions:', err);
      return interaction.reply({ content: await t(interaction.guildId, 'An error occurred while updating permissions.'), ephemeral: true });
    }

    const stateLabel = newPrivacy === 1 ? '🔒 private' : '🌐 public';
    return interaction.reply({ content: await t(interaction.guildId, 'The channel is now {state}.', { state: stateLabel }), ephemeral: true });
  }
};
