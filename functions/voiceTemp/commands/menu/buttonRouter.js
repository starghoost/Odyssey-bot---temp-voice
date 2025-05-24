// functions/voiceTemp/commands/menu/buttonRouter.js

/**
 * Router for handling interactive menu buttons, modals, and user select menus.
 * Dynamically loads button handlers from the /buttons directory and routes interaction events accordingly.
 */

const fs = require('fs');
const path = require('path');
const { getMenuRows } = require('./buttons/_menuLayout');
const { getMenuEmbed } = require('./menu');

const handlers = new Map();
const buttonsPath = path.join(__dirname, 'buttons');

// Load all button modules from the /buttons folder, except _menuLayout.js
for (const file of fs.readdirSync(buttonsPath)) {
  if (file.endsWith('.js') && file !== '_menuLayout.js') {
    const mod = require(path.join(buttonsPath, file));

    // If the module supports multiple IDs
    if (Array.isArray(mod.id)) {
      for (const id of mod.id) {
        handlers.set(id, mod.execute);
      }
    } 
    // Single ID module
    else if (mod.id && typeof mod.execute === 'function') {
      handlers.set(mod.id, mod.execute);
    }
  }
}

module.exports = {
  /**
   * Handles any interaction triggered by a button, modal, or user select menu.
   * Routes to the correct handler or updates the UI depending on the action.
   *
   * @param {import('discord.js').Interaction} interaction - The interaction from Discord
   */
  async handle(interaction) {
    const key = interaction.customId;

    if (!interaction.isButton() && !interaction.isModalSubmit() && !interaction.isUserSelectMenu()) return;

    // Handle menu pagination: e.g., menu_page:2
    if (key.startsWith('menu_page:')) {
      const page = parseInt(key.split(':')[1]);
      const [row1, row2] = getMenuRows(page);
      const embed = getMenuEmbed(page);
      embed.setThumbnail(interaction.guild.iconURL({ dynamic: true }));
      return interaction.update({ embeds: [embed], components: [row1, row2] });
    }

    // Handle cancel action (close the menu)
    if (key === 'cancel') {
      if (interaction.deferred || interaction.replied) {
        await interaction.deleteReply().catch(() => {});
      } else {
        await interaction.reply({ content: 'Menu closed.', ephemeral: true });
      }
      return;
    }

    // Call the corresponding handler
    const handler = handlers.get(key);
    if (!handler) {
      return interaction.reply({ content: 'This action is not implemented yet.', ephemeral: true });
    }

    try {
      await handler(interaction);
    } catch (error) {
      console.error(`Error handling ${key}:`, error);
      await interaction.reply({ content: 'An error occurred while executing this action.', ephemeral: true });
    }
  }
};
