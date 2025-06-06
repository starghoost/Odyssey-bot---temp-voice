-- database/schema.sql

-- Ensure the database exists and select it
CREATE DATABASE IF NOT EXISTS discord_voicebot;
USE discord_voicebot;

-- Table: base_channels
-- Stores reference voice channels created by admins that act as templates
CREATE TABLE base_channels (
  guild_id VARCHAR(32),                     -- Discord server ID
  channel_id VARCHAR(32) PRIMARY KEY,       -- Discord voice channel ID
  user_limit INT DEFAULT 0,                 -- Max users allowed in the channel
  default_name VARCHAR(100),                -- Default name when cloning the channel
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Creation timestamp
);

-- Table: temp_channels
-- Stores dynamically created temporary voice channels based on base_channels
CREATE TABLE temp_channels (
  temp_channel_id VARCHAR(32) PRIMARY KEY,  -- ID of the temporary voice channel
  base_channel_id VARCHAR(32),              -- FK reference to base channel
  guild_id VARCHAR(32),                     -- Discord server ID
  owner_id VARCHAR(32),                     -- User ID of the channel owner
  owner_name VARCHAR(100),                  -- Username of the owner
  name VARCHAR(100),                        -- Current name of the channel
  user_limit INT,                           -- User limit for the temp channel
  privacy TINYINT DEFAULT 0,                -- 0 = public, 1 = private
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (base_channel_id) REFERENCES base_channels(channel_id) ON DELETE SET NULL
);

-- Table: channel_bans
-- Users banned from specific temporary voice channels
CREATE TABLE channel_bans (
  temp_channel_id VARCHAR(32),
  banned_user_id VARCHAR(32),
  PRIMARY KEY (temp_channel_id, banned_user_id),
  FOREIGN KEY (temp_channel_id) REFERENCES temp_channels(temp_channel_id) ON DELETE CASCADE
);

-- Table: channel_whitelist
-- Users explicitly allowed to join private voice channels
CREATE TABLE channel_whitelist (
  temp_channel_id VARCHAR(32),
  user_id VARCHAR(32),
  PRIMARY KEY (temp_channel_id, user_id),
  FOREIGN KEY (temp_channel_id) REFERENCES temp_channels(temp_channel_id) ON DELETE CASCADE
);

-- Table: admin_roles
-- Server roles that have admin privileges in temp channels (e.g. can't be banned)
CREATE TABLE admin_roles (
  guild_id VARCHAR(32),
  role_id VARCHAR(32),
  PRIMARY KEY (guild_id, role_id)
);

-- Table: guild_settings
-- Stores per-guild configuration like language
CREATE TABLE IF NOT EXISTS guild_settings (
  guild_id VARCHAR(32) PRIMARY KEY,
  language VARCHAR(10) DEFAULT 'en'
);
