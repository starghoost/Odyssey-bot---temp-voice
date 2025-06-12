# 🎹 Discord Temporary Voice Channels Bot

A modular and MySQL-powered Discord bot to manage dynamic voice channels. Users can automatically generate, manage, and moderate temporary voice channels with fine-grained control.

---

## 📆 Features

* 🏗️ Auto-creation of voice channels when joining base channels
* ⏳ Auto-deletion of empty channels
* 🧑‍⚖️ Slash commands to manage ownership, privacy, mute/deafen, and more
* 🔒 Admin role protection from being kicked or banned
* 📂 MySQL persistence across bot restarts
* ⚒️ Full modular structure for easy scalability

---

## 📁 Project Structure

```
functions/
├── voiceTemp/
│   ├── commands/
│   │   ├── channel/           # Channel configuration slash commands
│   │   ├── menu/              # Button-based interaction menu
│   │   ├── moderation/        # Ownership and visibility commands
│   │   └── utility/           # Helper commands like help and search
│   ├── events/                # Voice state event listeners
│   └── ...                    # Utility handlers (autoDelete, claim, etc.)
lang/
├── tempovoice/               # Translation files for the temp voice module
│   ├── en.json
│   └── es.json
database/
├── mysql.js                   # MySQL connection and schema loader
├── schema.sql                 # Database schema definition
.env.example                  # Example environment variables
```

---

## ⚙️ Setup

1. Clone the repository:

```bash
 git clone https://github.com/starghoost/Odyssey-bot---temp-voice.git
 cd your-repo-name
```

2. Install dependencies:

```bash
npm install
```

3. Copy the example environment file and update it with your credentials:

```bash
cp .env.example .env
# then edit .env
```

4. Import the database schema into your MySQL server:

```bash
mysql -u root -p < database/schema.sql
```

5. Start the bot:

```bash
node index.js
```

---

## 🧪 Slash Commands Overview

| Command                 | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `/create_base_channel`  | Create a base channel for spawning temp voice channels |
| `/create_temp_channel`  | Create a temporary voice channel manually              |
| `/add_user`             | Allow a user into your private voice channel           |
| `/remove_user`          | Remove a user from your private voice channel          |
| `/mute` / `/unmute`     | Mute or unmute users in your channel                   |
| `/deafen` / `/undeafen` | Deafen or undeafen users in your channel               |
| `/ban` / `/unban`       | Block or unblock users from entering your temp channel |
| `/kick`                 | Kick a user from your temp channel                     |
| `/claim`                | Claim ownership of the channel you’re connected to     |
| `/rename`               | Rename your temporary channel                          |
| `/private` / `/public`  | Toggle privacy settings on your channel                |
| `/transfer`             | Transfer channel ownership to another user             |
| `/search`               | Find out which channel a user is in                    |
| `/active_channels`      | Admin-only command: view all active temp channels      |
| `/setadminroles`        | Set roles that are immune to being kicked/banned       |
| `/menu`                 | Open the visual control panel                          |
| `/help`                 | List of all available commands                         |

---

## 🧹 Requirements

* Node.js v18+
* Discord bot with proper intents
* MySQL server (5.7+ or MariaDB)

---

## 👥 Credits

* Developed by **Starghoost**
* Discord.js v14
* Inspired by TempVoice

---

## 📄 License

This project is licensed under a custom attribution license:

> You are free to use, modify, and share this code for personal and commercial use, **as long as clear and visible credit is given** to the original author: **Starghoost**. Attribution must remain visible in all derivative works, source files, and public-facing materials.

© 2025 Developed by **Starghoost**. All rights reserved.
