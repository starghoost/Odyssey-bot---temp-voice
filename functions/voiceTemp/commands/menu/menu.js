// functions/voiceTemp/commands/menu/menu.js

/**
 * Slash command that opens the interactive control menu for temporary voice channels.
 * The menu is paginated and built with buttons from _menuLayout.js.
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getMenuRows } = require('./buttons/_menuLayout');
const { t } = require('../../../utils/translator');

/**
 * Builds the main embed that shows the control options available in the interactive panel.
 *
 * @param {number} page - Page number of the menu (1 or 2)
 * @returns {EmbedBuilder} The embed to display
 */
async function getMenuEmbed(guildId, page = 1) {
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setThumbnail(null)
    .setFooter({ text: await t(guildId, 'Temporary Voice Channel Management System') });

  if (page === 1) {
    embed.setTitle(await t(guildId, '🎛️ Temporary Channel Control Panel'))
      .setDescription(
        `\`🔤\` ${await t(guildId, 'Rename')}    \`🔐\` ${await t(guildId, 'Privacy')}    \`👑\` ${await t(guildId, 'Claim')}     \`➡️\` ${await t(guildId, 'Next page')}\n` +
        `\`🚫\` ${await t(guildId, 'Ban')}            \`⚔️\` ${await t(guildId, 'Kick')}        \`✅\` ${await t(guildId, 'Unban')}      \`✖️\` ${await t(guildId, 'Close menu')}`
      );
  } else if (page === 2) {
    embed.setTitle(await t(guildId, '🎛️ Advanced Channel Options'))
      .setDescription(
        `\`🔇\` ${await t(guildId, 'Mute')}    \`🔊\` ${await t(guildId, 'Unmute')}        \`🙉\` ${await t(guildId, 'Deafen')}      \`👂\` ${await t(guildId, 'Undeafen')}\n` +
        `\`⬅️\` ${await t(guildId, 'Back')}       \`🔍\` ${await t(guildId, 'Search user')}   \`✖️\` ${await t(guildId, 'Close menu')}`
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
    const embed = await getMenuEmbed(interaction.guildId, page);
    embed.setThumbnail(interaction.guild.iconURL({ dynamic: true }));

    return interaction.reply({
      embeds: [embed],
      components: [row1, row2],
      ephemeral: true
    });
  },

  getMenuEmbed // Exported for use in buttonRouter.js
};
