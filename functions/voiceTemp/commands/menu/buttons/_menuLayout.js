// functions/voiceTemp/commands/menu/buttons/_menuLayout.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Returns a set of ActionRowBuilder components to render interactive menu buttons.
 * The menu has two pages of controls that allow channel owners to manage their temporary voice channel.
 *
 * @param {number} page - The current menu page (defaults to 1)
 * @returns {ActionRowBuilder[]} Array of rows with buttons for the specified page
 */
function getMenuRows(page = 1) {
  if (page === 1) {
    // Page 1: General channel controls
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('rename').setStyle(ButtonStyle.Secondary).setEmoji('🔤').setLabel(' '),           // Rename channel
      new ButtonBuilder().setCustomId('privacy_toggle').setStyle(ButtonStyle.Secondary).setEmoji('🔐').setLabel(' '), // Toggle public/private
      new ButtonBuilder().setCustomId('claim').setStyle(ButtonStyle.Secondary).setEmoji('👑').setLabel(' '),           // Claim channel ownership
      new ButtonBuilder().setCustomId('menu_page:2').setStyle(ButtonStyle.Secondary).setEmoji('➡️').setLabel(' ')     // Go to page 2
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ban').setStyle(ButtonStyle.Secondary).setEmoji('🚫').setLabel(' '),             // Ban user
      new ButtonBuilder().setCustomId('unban').setStyle(ButtonStyle.Secondary).setEmoji('✅').setLabel(' '),           // Unban user
      new ButtonBuilder().setCustomId('kick').setStyle(ButtonStyle.Secondary).setEmoji('⚔️').setLabel(' '),           // Kick user
      new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Secondary).setEmoji('✖️').setLabel(' '),         // Close menu
    );

    return [row1, row2];
  } else if (page === 2) {
    // Page 2: Audio moderation controls
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('mute').setStyle(ButtonStyle.Secondary).setEmoji('🔇').setLabel(' '),            // Mute user
      new ButtonBuilder().setCustomId('unmute').setStyle(ButtonStyle.Secondary).setEmoji('🔊').setLabel(' '),          // Unmute user
      new ButtonBuilder().setCustomId('deafen').setStyle(ButtonStyle.Secondary).setEmoji('🙉').setLabel(' '),         // Deafen user
      new ButtonBuilder().setCustomId('undeafen').setStyle(ButtonStyle.Secondary).setEmoji('👂').setLabel(' ')        // Undeafen user
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('menu_page:1').setStyle(ButtonStyle.Secondary).setEmoji('⬅️').setLabel(' '),    // Return to page 1
      new ButtonBuilder().setCustomId('search_user').setStyle(ButtonStyle.Secondary).setEmoji('🔍').setLabel(' '),     // Search for user
      new ButtonBuilder().setCustomId('cancel').setStyle(ButtonStyle.Secondary).setEmoji('✖️').setLabel(' ')          // Close menu
    );

    return [row1, row2];
  }
}

module.exports = { getMenuRows };
