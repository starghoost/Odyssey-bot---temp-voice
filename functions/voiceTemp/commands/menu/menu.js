// functions/voiceTemp/commands/menu/menu.js

/**
 * Slash command that opens the interactive control menu for temporary voice channels.
 * The menu is paginated and built with buttons from _menuLayout.js.
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getMenuRows } = require('./buttons/_menuLayout');

/**
 * Builds the main embed that shows the control options available in the interactive panel.
 *
 * @param {number} page - Page number of the menu (1 or 2)
 * @returns {EmbedBuilder} The embed to display
 */
function getMenuEmbed(page = 1) {
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setThumbnail(null)
    .setFooter({ text: 'Temporary Voice Channel Management System' });

  if (page === 1) {
    embed.setTitle('🎛️ Temporary Channel Control Panel')
      .setDescription(
        '`🔤` Rename    `🔐` Privacy    `👑` Claim     `➡️` Next page\n' +
        '`🚫` Ban            `⚔️` Kick        `✅` Unban      `✖️` Close menu'
      );
  } else if (page === 2) {
    embed.setTitle('🎛️ Advanced Channel Options')
      .setDescription(
        '`🔇` Mute    `🔊` Unmute        `🙉` Deafen      `👂` Undeafen\n' +
        '`⬅️` Back       `🔍` Search user   `✖️` Close menu'
      );
  }

  return embed;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('Opens the interactive control menu for managing your temporary voice channel.'),

  /**
   * Executes the /menu command and sends the first menu page with its buttons.
   *
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const page = 1;
    const [row1, row2] = getMenuRows(page);
    const embed = getMenuEmbed(page);
    embed.setThumbnail(interaction.guild.iconURL({ dynamic: true }));

    return interaction.reply({
      embeds: [embed],
      components: [row1, row2],
      ephemeral: true
    });
  },

  getMenuEmbed // Exported for use in buttonRouter.js
};
