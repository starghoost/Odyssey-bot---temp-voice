// functions/voiceTemp/setAdminRole.js

/**
 * Slash command to add or remove a role with administrative privileges
 * for managing temporary voice channels.
 * Admin roles are allowed to perform restricted actions without full Discord admin permissions.
 */

const { SlashCommandBuilder } = require('discord.js');
const { t } = require('./../../../utils/translator');
const { getDb } = require('../../../../database/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin_role')
    .setDescription('Adds or removes a role with administrative privileges for managing temp channels.')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('The role to add or remove as admin')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Action to perform')
        .addChoices(
          { name: 'add', value: 'add' },
          { name: 'remove', value: 'remove' }
        )
        .setRequired(true)),

  /**
   * Executes the /admin_role command.
   * Only users with the "Administrator" permission can use this command.
   * Based on the selected action, it adds or removes the role in the `admin_roles` table.
   *
   * @param {import('discord.js').ChatInputCommandInteraction} interaction - The command interaction from Discord.
   */
  async execute(interaction) {
    const db = getDb();
    const guild = interaction.guild;
    const member = interaction.member;

    // Check if the user has Discord administrator permissions
    if (!member.permissions.has('Administrator')) {
      return interaction.reply({ content: await t(interaction.guildId, 'Only administrators can use this command.'), ephemeral: true });
    }

    const role = interaction.options.getRole('role');
    const action = interaction.options.getString('action');

    if (action === 'add') {
      // Insert the role as admin if not already present
      await db.execute(
        'INSERT IGNORE INTO admin_roles (guild_id, role_id) VALUES (?, ?)',
        [guild.id, role.id]
      );
      return interaction.reply({
        content: await t(interaction.guildId, 'The role **{role}** now has administrative privileges.', { role: role.name }),
        ephemeral: true
      });
    } else {
      // Remove the role from the admin list
      await db.execute(
        'DELETE FROM admin_roles WHERE guild_id = ? AND role_id = ?',
        [guild.id, role.id]
      );
      return interaction.reply({
        content: await t(interaction.guildId, 'The role **{role}** no longer has administrative privileges.', { role: role.name }),
        ephemeral: true
      });
    }
  }
};
