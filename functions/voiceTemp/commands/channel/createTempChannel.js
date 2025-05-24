// functions/voiceTemp/createTempChannel.js

/**
 * Slash command to create a custom temporary voice channel in Discord.
 * Stores its configuration in the database and applies permission settings for public/private modes.
 */

const {
  SlashCommandBuilder,
  ChannelType,
  PermissionsBitField,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder
} = require('discord.js');

const { getDb } = require('../../../../database/mysql');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create_temp_channel')
    .setDescription('Creates a temporary custom voice channel.')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Name of the voice channel')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Maximum number of users')
        .setRequired(true))
    .addBooleanOption(option =>
      option.setName('private')
        .setDescription('Should the channel be private?')),

  /**
   * Executes the /create_temp_channel command.
   * Creates a voice channel in the guild, applies permissions, stores it in the DB, and shows a summary embed.
   *
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const name = interaction.options.getString('name');
    const limit = interaction.options.getInteger('limit');
    const isPrivate = interaction.options.getBoolean('private') || false;
    const member = interaction.member;
    const guild = interaction.guild;

    // Create the Discord voice channel
    const channel = await guild.channels.create({
      name: name,
      type: ChannelType.GuildVoice,
      userLimit: limit > 0 ? limit : 0,
      permissionOverwrites: isPrivate
        ? [
            {
              id: guild.roles.everyone,
              deny: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel]
            },
            {
              id: member.id,
              allow: [PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.ViewChannel]
            }
          ]
        : []
    });

    // Save channel information to the database
    const db = getDb();
    await db.execute(
      `INSERT INTO temp_channels
        (temp_channel_id, base_channel_id, guild_id, owner_id, owner_name, name, user_limit, privacy)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?)`,
      [channel.id, guild.id, member.id, member.user.username, name, limit, isPrivate ? 1 : 0]
    );

    // Build the response embed
    const embed = new EmbedBuilder()
      .setTitle('🎙 Temporary Channel Created')
      .setDescription(`The channel **${name}** has been created.`)
      .addFields(
        { name: 'Type', value: isPrivate ? '🔒 Private' : '🌐 Public', inline: true },
        { name: 'User Limit', value: `${limit}`, inline: true },
        { name: 'Channel ID', value: `${channel.id}`, inline: true }
      )
      .setColor('#5865F2')
      .setFooter({ text: 'Temporary Channel System' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Go to Channel')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/channels/${guild.id}/${channel.id}`)
    );

    // Reply to the user with embed and link
    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};



