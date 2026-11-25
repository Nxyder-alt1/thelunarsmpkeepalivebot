// index.js — ultra-light keepalive bot + Express /ping endpoint

const mineflayer = require('mineflayer');
const express = require('express');

// ============================================
// CONFIG
// ============================================
const BOT_CONFIG = {
  host: 'the-lunar-smp.play.hosting',
  port: 25565,
  username: 'Lunar_Bot',
  version: '1.21.1',
  hideInventory: true,
};

const PASSWORD = '<passKeepAliveBot>'; // <-- VERVANG DIT MET JE WACHTWOORD

let bot = null;
let reconnectTimer = null;
let isConnecting = false;

// ============================================
// CRASH-BEVEILIGING (Nooit process.exit)
// ============================================
process.on('uncaughtException', (err) => {
  const msg = (err && err.message) || '';
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
});

process.on('unhandledRejection', (reason) => {
  console.warn('[kiddo] unhandledRejection genegeerd');
});

// ============================================
// FUNCTIE OM BOT TE STARTEN / HERSTARTEN
// ============================================
function startBot() {
  if (isConnecting || bot) {
    return;
  }

  isConnecting = true;
  console.log('[kiddo] Verbinden met server...');

  try {
    bot = mineflayer.createBot({
      host: BOT_CONFIG.host,
      port: BOT_CONFIG.port,
      username: BOT_CONFIG.username,
      version: BOT_CONFIG.version,
      hideInventory: BOT_CONFIG.hideInventory,
      checkTimeoutInterval: 0,
    });
  } catch (err) {
    console.error('[kiddo] createBot faalde:', err.message);
    isConnecting = false;
    scheduleReconnect('create-error');
    return;
  }

  // ============================================
  // SPAWN
  // ============================================
  bot.once('spawn', () => {
    isConnecting = false;
    console.log('[kiddo] ✅ Ingelogd en gespawned');

    try {
      bot.physics.enabled = false;
    } catch (_) {}

    // Stuur login na 2 seconden
    setTimeout(() => {
      try {
        if (bot) bot.chat(`/login ${PASSWORD}`);
      } catch (_) {}
    }, 2000);
  });

  // ============================================
  // DISCONNECT & ERROR HANDLERS (Geen process.exit!)
  // ============================================
  bot.on('kicked', (reason) => {
    console.log('[kiddo] ❌ Gekickt:', reason);
    cleanupAndReconnect('kicked');
  });

  bot.on('error', (err) => {
    console.log('[kiddo] ⚠️ Error:', err.message);
    cleanupAndReconnect('error: ' + err.message);
  });

  bot.on('end', (reason) => {
    console.log('[kiddo] Verbinding verbroken:', reason);
    cleanupAndReconnect('end: ' + reason);
  });
}

// ============================================
// RECONNECT HELPER
// ============================================
function cleanupAndReconnect(reason) {
  isConnecting = false;
  if (bot) {
    try {
      bot.removeAllListeners();
      bot.end();
    } catch (_) {}
    bot = null;
  }

  scheduleReconnect(reason);
}

function scheduleReconnect(reason) {
  if (reconnectTimer) return; // Al gepland

  console.log(`[kiddo] 🔁 Opnieuw verbinden over 5 seconden (${reason})...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    startBot();
  }, 5000);
}

// ============================================
// EXPRESS API SERVER (/ping)
// ============================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/ping', (req, res) => {
  res.status(200).send('OK');
});

app.get('/', (req, res) => {
  res.status(200).send(bot && bot.player ? 'Bot is online' : 'Bot is aan het verbinden/offline');
});

app.listen(PORT, () => {
  console.log(`[HTTP] API Server draait op poort ${PORT}`);
});

// ============================================
// START DE BOT
// ============================================
startBot();
