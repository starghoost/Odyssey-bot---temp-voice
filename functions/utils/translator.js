const fs = require('fs');
const path = require('path');
const { getDb } = require('../../database/mysql');

// Helper to load JSON files that may contain comments
function loadJsonWithComments(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove /* */ comments
    .replace(/\/\/.*$/gm, ''); // remove // comments
  return JSON.parse(content);
}

// Load translation files for the temp voice module (supports comments)
const locales = {
  en: loadJsonWithComments(path.join(__dirname, '../../lang/tempovoice/en.json')),
  es: loadJsonWithComments(path.join(__dirname, '../../lang/tempovoice/es.json'))
};

async function getGuildLanguage(guildId) {
  const db = getDb();
  const [rows] = await db.execute(
    'SELECT language FROM guild_settings WHERE guild_id = ?',
    [guildId]
  );
  return rows[0]?.language || 'en';
}

function translateText(lang, text, params = {}) {
  const table = locales[lang] || locales.en;
  let result = table[text] || text;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return result;
}

async function t(guildId, text, params = {}) {
  const lang = await getGuildLanguage(guildId);
  return translateText(lang, text, params);
}

module.exports = { t, getGuildLanguage };
