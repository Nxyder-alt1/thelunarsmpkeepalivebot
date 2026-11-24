// index.js — ultra-light keepalive bot voor theempiresmp
// Doet ALLEEN: verbinden, inloggen, wachten. Geen beweging, geen packets.

const mineflayer = require('mineflayer');

// ============================================
// CONFIG
// ============================================
const BOT_CONFIG = {
  host: 'theempiresmp.play.hosting',
  port: 25565,
  username: 'Thekiddo_Bot',
  version: '1.21.1',
  // BELANGRIJK: voorkom dat mineflayer zelf physics/packets stuurt
  physicsEnabled: false,
  hideInventory: true,
};

const PASSWORD = '<passKeepAliveBot>'; // <-- VERVANG DIT

// ============================================
// CRASH-BEVEILIGING
// ============================================
process.on('uncaughtException', (err) => {
  const msg = (err && err.message) || '';
  // Negeer bekende parse-fouten — bot blijft draaien
  if (
    msg.includes('unknown chat format code') ||
    msg.includes('PartialReadError') ||
    msg.includes('Read error for undefined') ||
    msg.includes('Invalid move player packet') ||
    msg.includes('timed out')
  ) {
    console.warn('[kiddo] fout genegeerd:', msg.slice(0, 80));
    return;
  }
  console.error('[kiddo] crash:', msg);
  // Bij echte crash: laat Render de service herstarten
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.warn('[kiddo] unhandledRejection genegeerd');
});

// ============================================
// BOT AANMAKEN
// ============================================
console.log('[kiddo] Verbinden...');

let bot;
try {
  bot = mineflayer.createBot({
    host: BOT_CONFIG.host,
    port: BOT_CONFIG.port,
    username: BOT_CONFIG.username,
    version: BOT_CONFIG.version,
    hideInventory: BOT_CONFIG.hideInventory,
    // Schakel Mineflayer's eigen timeout volledig uit
    checkTimeoutInterval: 0,
  });
} catch (err) {
  console.error('[kiddo] createBot faalde:', err.message);
  process.exit(1);
}

// ============================================
// SPAWN — alleen inloggen, dan niets meer
// ============================================
bot.once('spawn', () => {
  console.log('[kiddo] ✅ Ingelogd');

  // Zet physics uit zodat er GEEN bewegingspackets worden gestuurd
  try {
    bot.physics.enabled = false;
  } catch (_) {}

  // Stuur ALLEEN het login-commando
  setTimeout(() => {
    try {
      bot.chat(`/login ${PASSWORD}`);
    } catch (_) {}
  }, 2000);

  // Klaar. De bot doet nu NIETS meer.
  // Geen loops, geen movement, geen chat.
});

// ============================================
// ALLEEN NODIGE EVENTS — geen chat-listener, geen message-listener
// ============================================
bot.on('kicked', (reason) => {
  console.log('[kiddo] ❌ Gekickt');
  process.exit(1);
});

bot.on('error', (err) => {
  console.log('[kiddo] ⚠️ Error:', err.message);
  process.exit(1);
});

bot.on('end', (reason) => {
  console.log('[kiddo] Verbinding verbroken');
  process.exit(1);
});
