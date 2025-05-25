// index.js

// Load environment variables from .env file
require('dotenv').config();

const { Client, GatewayIntentBits, Collection, Partials, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { connectToDatabase, getDb } = require('./database/mysql');

// Create a new Discord client with required intents to access guilds, messages, and voice states
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();

// Import voice channel-related event handlers
const autoDelete = require('./functions/voiceTemp/events/autoDeleteChannel');
const voiceCreateTemp = require('./functions/voiceTemp/events/voiceCreateTemp');
const voiceBanGuard = require('./functions/voiceTemp/events/voiceBanGuard');
const joinChannelButton = require('./functions/voiceTemp/commands/utility/searchUser');
const buttonRouter = require('./functions/voiceTemp/commands/menu/buttonRouter');

// Hook voice state updates to the appropriate handlers
client.on('voiceStateUpdate', async (...args) => {
  await voiceCreateTemp.execute(...args);
  await autoDelete.execute(...args);
  await voiceBanGuard.execute(...args);
});

// Recursively load all slash commands in the functions folder
function loadCommandsRecursively(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadCommandsRecursively(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const command = require(fullPath);
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
      }
    }
  }
}

const commands = [];
loadCommandsRecursively(path.join(__dirname, 'functions'));

// When the bot becomes ready
client.once('ready', async () => {
  // Clean up orphaned database entries and empty channels every minute
  setInterval(async () => {
    const db = getDb();
    const [records] = await db.execute('SELECT guild_id, channel_id FROM base_channels');
    for (const { guild_id, channel_id } of records) {
      const guild = client.guilds.cache.get(guild_id);
      if (!guild) continue;
      const channel = guild.channels.cache.get(channel_id);
      if (!channel) {
        await db.execute('DELETE FROM base_channels WHERE channel_id = ?', [channel_id]);
        console.log(`🗑 Base channel with ID ${channel_id} removed from DB (not found in guild ${guild_id}).`);
      }
    }

    const [temps] = await db.execute('SELECT temp_channel_id, guild_id FROM temp_channels');
    for (const { temp_channel_id, guild_id } of temps) {
      const guild = client.guilds.cache.get(guild_id);
      if (!guild) continue;
      const channel = guild.channels.cache.get(temp_channel_id);
      if (!channel) {
        await db.execute('DELETE FROM temp_channels WHERE temp_channel_id = ?', [temp_channel_id]);
        console.log(`🗑 Temp channel with ID ${temp_channel_id} removed from DB (not found in guild ${guild_id}).`);
      }
    }

    const tempChannels = temps
      .map(row => client.channels.cache.get(row.temp_channel_id))
      .filter(channel => channel && channel.type === 2); // 2 = GuildVoice

    for (const voiceChannel of tempChannels) {
      if (voiceChannel.members.size === 0) {
        await db.execute('DELETE FROM temp_channels WHERE temp_channel_id = ?', [voiceChannel.id]);
        await voiceChannel.delete().catch(() =>
          console.log(`⚠ Could not delete channel ${voiceChannel.id}, it may no longer exist or permissions are missing.`)
        );
        console.log(`🗑 Temp voice channel ${voiceChannel.id} deleted (was empty).`);
      }
    }
  }, 1 * 60 * 1000);

  console.log(`Logged in as ${client.user.tag}`);

  await connectToDatabase();

  // Register slash commands for all guilds
  const CLIENT_ID = client.user.id;
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    console.log('🔄 Registering slash commands per guild...');
    for (const [guildId] of client.guilds.cache) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), {
        body: commands
      });
      console.log(`✅ Commands registered in guild ${guildId}`);
    }
  } catch (error) {
    console.error('Error registering commands:', error);
  }
});

// Register commands automatically when the bot joins a new guild
client.on('guildCreate', async (guild) => {
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), {
      body: commands
    });
    console.log(`✅ Commands registered in new guild ${guild.id}`);
  } catch (error) {
    console.error(`❌ Error registering commands in new guild ${guild.id}:`, error);
  }
});

// Handle slash commands and button/menu interactions
client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true });
    }
  } else {
    try {
      await buttonRouter.handle(interaction);
      await joinChannelButton.execute(interaction);
    } catch (error) {
      console.error('Error handling interaction:', error);
    }
  }
});

// Start the bot by logging in
client.login(process.env.TOKEN);
