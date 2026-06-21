/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║          MULTIPURPOSE DISCORD BOT — PREFIX: !                ║
 * ║   100+ commands: Moderation, Levels, Fun, Utilities           ║
 * ║   Inspired by: Saphire • Dyno • Arcane • Circle              ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

require('dotenv').config();

const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const ms = require('ms');
const Jimp = require('jimp');

// ─── Config ───────────────────────────────────────────────────────────────────
const PREFIX = '!';
const TOKEN = process.env.TOKEN;       // Railway variable or .env file
const OWNER_ID = process.env.OWNER_ID; // Railway variable or .env file

const db = new QuickDB();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildExpressions,
  ],
});

client.commands = new Collection();
const cooldowns = new Collection();

// ─── Colors & Helpers ──────────────────────────────────────────────────────────
const COLORS = {
  primary:  0x5865F2,
  success:  0x57F287,
  error:    0xED4245,
  warning:  0xFEE75C,
  info:     0x5865F2,
  xp:       0xF1C40F,
  mod:      0xE74C3C,
};

function embed(title, desc, color = COLORS.primary) {
  return new EmbedBuilder().setTitle(title).setDescription(desc).setColor(color).setTimestamp();
}

function errorEmbed(desc) {
  return embed('❌ Error', desc, COLORS.error);
}

function successEmbed(desc) {
  return embed('✅ Success', desc, COLORS.success);
}

async function getLogChannel(guild) {
  const logChannelId = await db.get(`logs_${guild.id}`);
  if (!logChannelId) return null;
  return guild.channels.cache.get(logChannelId) || null;
}

function logEmbed(title, color = COLORS.mod) {
  return new EmbedBuilder().setTitle(title).setColor(color).setTimestamp();
}

// ─── Generated Welcome Banner (gold text on black, pure JS via Jimp) ─────────
async function generateWelcomeImage() {
  const WIDTH = 1000, HEIGHT = 350;
  const GOLD = { r: 0xD4, g: 0xAF, b: 0x37 };

  const bg = new Jimp(WIDTH, HEIGHT, 0x000000FF);

  // Gold border
  const borderThickness = 6;
  bg.scan(0, 0, WIDTH, HEIGHT, function (x, y, idx) {
    if (x < borderThickness || x >= WIDTH - borderThickness || y < borderThickness || y >= HEIGHT - borderThickness) {
      this.bitmap.data[idx] = GOLD.r;
      this.bitmap.data[idx + 1] = GOLD.g;
      this.bitmap.data[idx + 2] = GOLD.b;
      this.bitmap.data[idx + 3] = 255;
    }
  });

  // Print white text, then recolor white pixels to gold (keeps anti-aliasing)
  const font = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);
  const textLayer = new Jimp(WIDTH, HEIGHT, 0x00000000);
  textLayer.print(font, 0, 0, {
    text: 'WELCOME',
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
  }, WIDTH, HEIGHT);

  textLayer.scan(0, 0, textLayer.bitmap.width, textLayer.bitmap.height, function (x, y, idx) {
    const alpha = this.bitmap.data[idx + 3];
    if (alpha > 0) {
      this.bitmap.data[idx] = GOLD.r;
      this.bitmap.data[idx + 1] = GOLD.g;
      this.bitmap.data[idx + 2] = GOLD.b;
    }
  });

  bg.composite(textLayer, 0, 0);
  return bg.getBufferAsync(Jimp.MIME_PNG);
}

// ─── Generated Goodbye Banner (gold text on black, pure JS via Jimp) ─────────
async function generateGoodbyeImage() {
  const WIDTH = 1000, HEIGHT = 350;
  const GOLD = { r: 0xD4, g: 0xAF, b: 0x37 };

  const bg = new Jimp(WIDTH, HEIGHT, 0x000000FF);

  const borderThickness = 6;
  bg.scan(0, 0, WIDTH, HEIGHT, function (x, y, idx) {
    if (x < borderThickness || x >= WIDTH - borderThickness || y < borderThickness || y >= HEIGHT - borderThickness) {
      this.bitmap.data[idx] = GOLD.r;
      this.bitmap.data[idx + 1] = GOLD.g;
      this.bitmap.data[idx + 2] = GOLD.b;
      this.bitmap.data[idx + 3] = 255;
    }
  });

  const font = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);
  const textLayer = new Jimp(WIDTH, HEIGHT, 0x00000000);
  textLayer.print(font, 0, 0, {
    text: 'GOODBYE',
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
  }, WIDTH, HEIGHT);

  textLayer.scan(0, 0, textLayer.bitmap.width, textLayer.bitmap.height, function (x, y, idx) {
    const alpha = this.bitmap.data[idx + 3];
    if (alpha > 0) {
      this.bitmap.data[idx] = GOLD.r;
      this.bitmap.data[idx + 1] = GOLD.g;
      this.bitmap.data[idx + 2] = GOLD.b;
    }
  });

  bg.composite(textLayer, 0, 0);
  return bg.getBufferAsync(Jimp.MIME_PNG);
}

// ─── Generated Level Up Banner (gold text on black, pure JS via Jimp) ───────
// Shows only the level reached — no rank, no XP, no coins, no role color.
async function generateLevelUpImage(level) {
  const WIDTH = 1000, HEIGHT = 350;
  const GOLD = { r: 0xD4, g: 0xAF, b: 0x37 };

  const bg = new Jimp(WIDTH, HEIGHT, 0x000000FF);

  // Gold border
  const borderThickness = 6;
  bg.scan(0, 0, WIDTH, HEIGHT, function (x, y, idx) {
    if (x < borderThickness || x >= WIDTH - borderThickness || y < borderThickness || y >= HEIGHT - borderThickness) {
      this.bitmap.data[idx] = GOLD.r;
      this.bitmap.data[idx + 1] = GOLD.g;
      this.bitmap.data[idx + 2] = GOLD.b;
      this.bitmap.data[idx + 3] = 255;
    }
  });

  // "LEVEL UP!" small caption on top
  const captionFont = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
  const captionLayer = new Jimp(WIDTH, 130, 0x00000000);
  captionLayer.print(captionFont, 0, 0, {
    text: 'LEVEL UP!',
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
  }, WIDTH, 130);
  captionLayer.scan(0, 0, captionLayer.bitmap.width, captionLayer.bitmap.height, function (x, y, idx) {
    const alpha = this.bitmap.data[idx + 3];
    if (alpha > 0) {
      this.bitmap.data[idx] = GOLD.r;
      this.bitmap.data[idx + 1] = GOLD.g;
      this.bitmap.data[idx + 2] = GOLD.b;
    }
  });
  bg.composite(captionLayer, 0, 30);

  // Big level number underneath
  const levelFont = await Jimp.loadFont(Jimp.FONT_SANS_128_WHITE);
  const levelLayer = new Jimp(WIDTH, 200, 0x00000000);
  levelLayer.print(levelFont, 0, 0, {
    text: `LEVEL ${level}`,
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
  }, WIDTH, 200);
  levelLayer.scan(0, 0, levelLayer.bitmap.width, levelLayer.bitmap.height, function (x, y, idx) {
    const alpha = this.bitmap.data[idx + 3];
    if (alpha > 0) {
      this.bitmap.data[idx] = GOLD.r;
      this.bitmap.data[idx + 1] = GOLD.g;
      this.bitmap.data[idx + 2] = GOLD.b;
    }
  });
  bg.composite(levelLayer, 0, 150);

  return bg.getBufferAsync(Jimp.MIME_PNG);
}

function parseDuration(str) {
  try { return ms(str); } catch { return null; }
}

function formatDuration(ms_val) {
  const s = Math.floor(ms_val / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

// ─── Sticky Messages (StickyBot-style) ───────────────────────────────────────
const MIDDLEMAN_CHANNEL_ID = '1513224477792534629';

// Builds the sticky embed, auto-mentioning whichever channel it's posted in.
function buildStickyMessage(channelId) {
  return new EmbedBuilder()
    .setDescription(`Welcome to the trading room <#${channelId}>\nTo facilitate your trades, we offer a middleman system available 24/7 In <#${MIDDLEMAN_CHANNEL_ID}>`)
    .setColor(0xD4AF37)
    .setTimestamp();
}

// Deletes the previous sticky post (if it still exists) and sends a fresh one
// at the bottom of the channel, then saves the new message id.
async function repostSticky(channel, guildId) {
  const key = `sticky_${guildId}_${channel.id}`;
  const data = await db.get(key);
  if (!data) return;
  try {
    if (data.messageId) {
      const oldMsg = await channel.messages.fetch(data.messageId).catch(() => null);
      if (oldMsg) await oldMsg.delete().catch(() => {});
    }
    const newMsg = await channel.send({ embeds: [buildStickyMessage(channel.id)] });
    await db.set(key, { channelId: channel.id, messageId: newMsg.id });
  } catch (err) {
    console.error('[Sticky] Error:', err);
  }
}

// ─── XP System (capped at level 100) ──────────────────────────────────────────
const MAX_LEVEL = 100;

async function addXP(member, amount) {
  const key = `xp_${member.guild.id}_${member.id}`;
  const current = (await db.get(key)) || { xp: 0, level: 0 };

  if (current.level >= MAX_LEVEL) {
    return { ...current, leveledUp: false }; // Max level reached, no more XP gain
  }

  current.xp += amount;
  let leveledUp = false;

  // Loop instead of a single "if" so a big XP gain (e.g. !givexp 1000) can
  // climb through several level thresholds in one go instead of only ever
  // processing one level-up and leaving the rest of the XP overflowing.
  while (current.level < MAX_LEVEL) {
    const xpNeeded = current.level * 100 + 100;
    if (current.xp < xpNeeded) break;
    current.xp -= xpNeeded;
    current.level++;
    leveledUp = true;
  }

  if (current.level >= MAX_LEVEL) {
    current.level = MAX_LEVEL;
    current.xp = 0;
  }

  await db.set(key, current);
  return { ...current, leveledUp };
}

async function getXP(userId, guildId) {
  return (await db.get(`xp_${guildId}_${userId}`)) || { xp: 0, level: 0 };
}

// Posts the gold/black level-up banner + ping in the channel configured via
// !setlevel (or a fallback channel if none is set). Shared by the natural
// chat XP gain and by !givexp so both trigger the same announcement.
async function announceLevelUp(guild, userId, level, fallbackChannel = null) {
  const levelupChannelId = await db.get(`levelup_${guild.id}`);
  const channel = levelupChannelId ? guild.channels.cache.get(levelupChannelId) : fallbackChannel;
  if (!channel) return;

  const mentionText = `<@${userId}>`;
  try {
    const buffer = await generateLevelUpImage(level);
    const attachment = new AttachmentBuilder(buffer, { name: 'levelup.png' });
    const e = new EmbedBuilder()
      .setTitle('⭐ Level Up!')
      .setDescription(`${mentionText} reached level **${level}**!`)
      .setColor(0xD4AF37)
      .setImage('attachment://levelup.png')
      .setTimestamp();
    await channel.send({ content: mentionText, embeds: [e], files: [attachment] }).catch(() => {});
  } catch (err) {
    console.error('[Level up image] Error:', err);
    await channel.send({ content: mentionText, embeds: [embed('⭐ Level up!', `${mentionText} reached **level ${level} / ${MAX_LEVEL}**! 🎉`, COLORS.xp)] }).catch(() => {});
  }
}

// ─── Message Stats (for !ms) ──────────────────────────────────────────────────
function dateKey(d) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

// Call on every non-bot message to bump the counters.
async function trackMessage(guildId, userId) {
  const key = `msgstats_${guildId}_${userId}`;
  const data = (await db.get(key)) || { total: 0, daily: {} };
  const today = dateKey(new Date());

  data.total = (data.total || 0) + 1;
  data.daily[today] = (data.daily[today] || 0) + 1;

  // Prune entries older than 40 days so the daily map doesn't grow forever
  // (40 covers the worst case of "this month" spanning into last month).
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 40);
  const cutoffKey = dateKey(cutoff);
  for (const k of Object.keys(data.daily)) {
    if (k < cutoffKey) delete data.daily[k];
  }

  await db.set(key, data);
}

function sumDailyInRange(daily, start, end) {
  const startKey = dateKey(start);
  const endKey = dateKey(end);
  let sum = 0;
  for (const [k, v] of Object.entries(daily)) {
    if (k >= startKey && k <= endKey) sum += v;
  }
  return sum;
}

// Returns { today, week, month, total } message counts for a member.
async function getMessageStats(guildId, userId) {
  const data = (await db.get(`msgstats_${guildId}_${userId}`)) || { total: 0, daily: {} };
  const now = new Date();
  const today = data.daily[dateKey(now)] || 0;

  // Start of the current (Monday-based) week, UTC
  const day = now.getUTCDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? 6 : day - 1;
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - diffToMonday);
  const week = sumDailyInRange(data.daily, weekStart, now);

  // Start of the current calendar month, UTC
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const month = sumDailyInRange(data.daily, monthStart, now);

  return { today, week, month, total: data.total || 0 };
}

// ─── Giveaways ──────────────────────────────────────────────────────────────
async function pickGiveawayWinners(channel, messageId, winnersCount) {
  try {
    const msg = await channel.messages.fetch(messageId);
    const reaction = msg.reactions.cache.get('🎉');
    if (!reaction) return [];
    const users = await reaction.users.fetch();
    const participants = users.filter(u => !u.bot).map(u => u.id);
    const shuffled = participants.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, winnersCount);
  } catch {
    return [];
  }
}

async function endGiveaway(giveawayId) {
  const data = await db.get(`giveaway_${giveawayId}`);
  if (!data || data.ended) return null;
  const guild = client.guilds.cache.get(data.guildId);
  if (!guild) return null;
  const channel = guild.channels.cache.get(data.channelId);
  if (!channel) return null;

  const winners = await pickGiveawayWinners(channel, giveawayId, data.winners);
  data.ended = true;
  data.winnerIds = winners;
  await db.set(`giveaway_${giveawayId}`, data);

  try {
    const msg = await channel.messages.fetch(giveawayId);
    const endedEmbed = EmbedBuilder.from(msg.embeds[0])
      .setColor(COLORS.error)
      .setFooter({ text: `Giveaway ended • ID: ${giveawayId}` });
    await msg.edit({ embeds: [endedEmbed] }).catch(() => {});
  } catch {}

  const winnerText = winners.length ? winners.map(id => `<@${id}>`).join(', ') : 'No valid participants 😢';
  const resultEmbed = new EmbedBuilder()
    .setTitle('🎉 Giveaway Ended')
    .setDescription(`**Prize:** ${data.prize}\n**Winner(s):** ${winnerText}`)
    .setColor(winners.length ? COLORS.success : COLORS.error)
    .setFooter({ text: `Giveaway ID: ${giveawayId}` })
    .setTimestamp();
  channel.send({ embeds: [resultEmbed] }).catch(() => {});
  return winners;
}

async function checkGiveaways() {
  try {
    const all = await db.all();
    const due = all.filter(e => e.id.startsWith('giveaway_') && !e.value.ended && e.value.endTime <= Date.now());
    for (const entry of due) {
      const giveawayId = entry.id.replace('giveaway_', '');
      await endGiveaway(giveawayId);
    }
  } catch (err) {
    console.error('[Giveaway checker] Error:', err);
  }
}

// ─── Commands ────────────────────────────────────────────────────────────────
const commands = {

  // ══════════════ ℹ️ HELP & INFO ══════════════
  help: {
    category: 'Info',
    description: 'Shows all commands',
    usage: '!help [command]',
    async execute(message, args) {
      if (args[0]) {
        const cmd = commands[args[0].toLowerCase()];
        if (!cmd) return message.reply({ embeds: [errorEmbed(`Command \`${args[0]}\` not found.`)] });
        return message.reply({
          embeds: [embed(`📖 ${args[0]}`, `**Description:** ${cmd.description}\n**Usage:** \`${cmd.usage || `!${args[0]}`}\`\n**Category:** ${cmd.category || 'General'}`, COLORS.info)]
        });
      }
      const cats = {};
      for (const [name, cmd] of Object.entries(commands)) {
        const cat = cmd.category || 'Other';
        if (!cats[cat]) cats[cat] = [];
        cats[cat].push(`\`!${name}\``);
      }
      const e = new EmbedBuilder()
        .setTitle('📚 Help — All commands')
        .setColor(COLORS.primary)
        .setFooter({ text: `Prefix: ${PREFIX} • ${Object.keys(commands).length} commands` })
        .setTimestamp();
      for (const [cat, cmds] of Object.entries(cats)) {
        e.addFields({ name: cat, value: cmds.join(', '), inline: false });
      }
      message.reply({ embeds: [e] });
    }
  },

  botinfo: {
    category: 'Info',
    description: 'Information about the bot',
    async execute(message) {
      const e = new EmbedBuilder()
        .setTitle('🤖 Bot Information')
        .setColor(COLORS.primary)
        .addFields(
          { name: '📡 Ping', value: `${client.ws.ping}ms`, inline: true },
          { name: '⏱ Uptime', value: formatDuration(client.uptime), inline: true },
          { name: '🖥 Servers', value: `${client.guilds.cache.size}`, inline: true },
          { name: '👥 Members', value: `${client.users.cache.size}`, inline: true },
          { name: '📦 discord.js', value: require('discord.js').version, inline: true },
          { name: '🟢 Node.js', value: process.version, inline: true },
        )
        .setThumbnail(client.user.displayAvatarURL())
        .setTimestamp();
      message.reply({ embeds: [e] });
    }
  },

  serverinfo: {
    category: 'Info',
    description: 'Information about the server',
    async execute(message) {
      const g = message.guild;
      const e = new EmbedBuilder()
        .setTitle(`🏠 ${g.name}`)
        .setColor(COLORS.primary)
        .setThumbnail(g.iconURL())
        .addFields(
          { name: '👑 Owner', value: `<@${g.ownerId}>`, inline: true },
          { name: '👥 Members', value: `${g.memberCount}`, inline: true },
          { name: '📅 Created on', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>`, inline: true },
          { name: '💬 Channels', value: `${g.channels.cache.size}`, inline: true },
          { name: '🎭 Roles', value: `${g.roles.cache.size}`, inline: true },
          { name: '😀 Emojis', value: `${g.emojis.cache.size}`, inline: true },
          { name: '🔒 Verification', value: g.verificationLevel.toString(), inline: true },
          { name: '💎 Boosts', value: `${g.premiumSubscriptionCount || 0} (Tier ${g.premiumTier})`, inline: true },
        )
        .setTimestamp();
      message.reply({ embeds: [e] });
    }
  },

  userinfo: {
    category: 'Info',
    description: 'Information about a user',
    usage: '!userinfo [@member]',
    async execute(message, args) {
      const member = message.mentions.members.first() || message.member;
      const u = member.user;
      const e = new EmbedBuilder()
        .setTitle(`👤 ${u.tag}`)
        .setColor(member.displayHexColor || COLORS.primary)
        .setThumbnail(u.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '🆔 ID', value: u.id, inline: true },
          { name: '📅 Account created', value: `<t:${Math.floor(u.createdTimestamp / 1000)}:D>`, inline: true },
          { name: '📥 Joined on', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`, inline: true },
          { name: '🎭 Roles', value: member.roles.cache.filter(r => r.id !== message.guild.id).map(r => `<@&${r.id}>`).join(', ') || 'None', inline: false },
          { name: '🤖 Bot', value: u.bot ? 'Yes' : 'No', inline: true },
          { name: '💎 Nickname', value: member.displayName, inline: true },
        )
        .setTimestamp();
      message.reply({ embeds: [e] });
    }
  },

  avatar: {
    category: 'Info',
    description: 'Shows a member\'s avatar',
    usage: '!avatar [@member]',
    async execute(message, args) {
      const user = message.mentions.users.first() || message.author;
      const e = new EmbedBuilder()
        .setTitle(`🖼 ${user.username}'s avatar`)
        .setImage(user.displayAvatarURL({ dynamic: true, size: 512 }))
        .setColor(COLORS.primary);
      message.reply({ embeds: [e] });
    }
  },

  ms: {
    category: 'Info',
    description: 'Shows a member\'s message count (today / this week / this month / total)',
    usage: '!ms [@member]',
    async execute(message, args) {
      const user = message.mentions.users.first() || message.author;
      const stats = await getMessageStats(message.guild.id, user.id);
      const e = new EmbedBuilder()
        .setAuthor({ name: `${user.username}'s Messages`, iconURL: user.displayAvatarURL() })
        .setColor(COLORS.info)
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setDescription(
          `**Messages Sent:**\n\n` +
          `Today: **${stats.today}**\n` +
          `This Week: **${stats.week}**\n` +
          `This Month: **${stats.month}**\n` +
          `Total: **${stats.total}**`
        )
        .setTimestamp();
      message.reply({ embeds: [e] });
    }
  },

  ping: {
    category: 'Info',
    description: 'Bot latency',
    async execute(message) {
      const m = await message.reply({ embeds: [embed('🏓 Calculating...', 'Please wait', COLORS.primary)] });
      m.edit({ embeds: [embed('🏓 Pong!', `\`${client.ws.ping}ms\` WebSocket — \`${m.createdTimestamp - message.createdTimestamp}ms\` API`, COLORS.primary)] });
    }
  },

  invite: {
    category: 'Info',
    description: 'Bot invite link',
    async execute(message) {
      const link = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`;
      message.reply({ embeds: [embed('📩 Invite the bot', `[Click here to invite me](${link})`, COLORS.info)] });
    }
  },

  // ══════════════ 🔨 MODERATION ══════════════
  ban: {
    category: 'Moderation',
    description: 'Ban a member',
    usage: '!ban @member [reason]',
    permissions: ['BanMembers'],
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const member = message.mentions.members.first();
      if (!member) return message.reply({ embeds: [errorEmbed('Mention a member.')] });
      const reason = args.slice(1).join(' ') || 'No reason';
      await member.ban({ reason, deleteMessageDays: 1 });
      message.reply({ embeds: [embed('🔨 Banned', `**${member.user.tag}** has been banned.\n📝 Reason: ${reason}`, COLORS.mod)] });
    }
  },

  kick: {
    category: 'Moderation',
    description: 'Kick a member',
    usage: '!kick @member [reason]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const member = message.mentions.members.first();
      if (!member) return message.reply({ embeds: [errorEmbed('Mention a member.')] });
      const reason = args.slice(1).join(' ') || 'No reason';
      await member.kick(reason);
      message.reply({ embeds: [embed('👢 Kicked', `**${member.user.tag}** has been kicked.\n📝 Reason: ${reason}`, COLORS.mod)] });
    }
  },

  mute: {
    category: 'Moderation',
    description: 'Mute a member (timeout)',
    usage: '!mute @member [duration] [reason]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const member = message.mentions.members.first();
      if (!member) return message.reply({ embeds: [errorEmbed('Mention a member.')] });
      const duration = parseDuration(args[1]) || ms('10m');
      const reason = args.slice(2).join(' ') || 'No reason';
      await member.timeout(duration, reason);
      message.reply({ embeds: [embed('🔇 Muted', `**${member.user.tag}** has been muted for **${formatDuration(duration)}**.\n📝 Reason: ${reason}`, COLORS.mod)] });
    }
  },

  unmute: {
    category: 'Moderation',
    description: 'Remove a member\'s mute',
    usage: '!unmute @member',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const member = message.mentions.members.first();
      if (!member) return message.reply({ embeds: [errorEmbed('Mention a member.')] });
      await member.timeout(null);
      message.reply({ embeds: [successEmbed(`**${member.user.tag}** is no longer muted.`)] });
    }
  },

  warn: {
    category: 'Moderation',
    description: 'Warn a member',
    usage: '!warn @member [reason]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const member = message.mentions.members.first();
      if (!member) return message.reply({ embeds: [errorEmbed('Mention a member.')] });
      const reason = args.slice(1).join(' ') || 'No reason';
      const key = `warns_${message.guild.id}_${member.id}`;
      const warns = (await db.get(key)) || [];
      warns.push({ reason, date: Date.now(), by: message.author.id });
      await db.set(key, warns);
      message.reply({ embeds: [embed('⚠️ Warning', `**${member.user.tag}** has received a warning.\n📝 Reason: ${reason}\n📊 Total: **${warns.length}** warn(s)`, COLORS.warning)] });
    }
  },

  warns: {
    category: 'Moderation',
    description: 'View a member\'s warnings',
    usage: '!warns @member',
    async execute(message, args) {
      const member = message.mentions.members.first() || message.member;
      const warns = (await db.get(`warns_${message.guild.id}_${member.id}`)) || [];
      if (!warns.length) return message.reply({ embeds: [successEmbed(`**${member.user.tag}** has no warnings.`)] });
      const list = warns.map((w, i) => `**${i+1}.** ${w.reason} — <t:${Math.floor(w.date/1000)}:R>`).join('\n');
      message.reply({ embeds: [embed(`⚠️ Warns for ${member.user.tag}`, list, COLORS.warning)] });
    }
  },

  clearwarns: {
    category: 'Moderation',
    description: 'Clear a member\'s warns',
    usage: '!clearwarns @member',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const member = message.mentions.members.first();
      if (!member) return message.reply({ embeds: [errorEmbed('Mention a member.')] });
      await db.delete(`warns_${message.guild.id}_${member.id}`);
      message.reply({ embeds: [successEmbed(`**${member.user.tag}**'s warns have been cleared.`)] });
    }
  },

  purge: {
    category: 'Moderation',
    description: 'Bulk delete messages',
    usage: '!purge [amount] [@member]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const amount = parseInt(args[0]);
      if (isNaN(amount) || amount < 1 || amount > 100) return message.reply({ embeds: [errorEmbed('Amount must be between 1 and 100.')] });
      const target = message.mentions.users.first();
      let messages = await message.channel.messages.fetch({ limit: 100 });
      if (target) messages = messages.filter(m => m.author.id === target.id);
      const toDelete = [...messages.values()].slice(0, amount);
      await message.channel.bulkDelete(toDelete, true);
      const m = await message.channel.send({ embeds: [successEmbed(`**${toDelete.length}** messages deleted.`)] });
      setTimeout(() => m.delete().catch(() => {}), 3000);
    }
  },

  // ══════════════ 🐌 SLOWMODE (FIXED) ══════════════
  slowmode: {
    category: 'Moderation',
    description: 'Enable slowmode on a channel. Accepts plain seconds (15) or durations with units (5s, 10m, 2h). Use 0 / off to disable.',
    usage: '!slowmode [duration]  — ex: !slowmode 30 | !slowmode 5m | !slowmode 2h | !slowmode off',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels))
        return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });

      const input = args[0];

      // ── Désactiver le slowmode ──────────────────────────────────────────────
      if (!input || ['0', 'off', 'disable', 'none'].includes(input.toLowerCase())) {
        await message.channel.setRateLimitPerUser(0);
        return message.reply({ embeds: [successEmbed('Slowmode disabled.')] });
      }

      let seconds;

      if (/^\d+$/.test(input)) {
        // ── Nombre brut sans unité → traité comme des secondes ─────────────
        seconds = parseInt(input, 10);
      } else {
        // ── Format avec unité : 5s, 10m, 2h, 1d … ─────────────────────────
        const durationMs = parseDuration(input);
        if (!durationMs || isNaN(durationMs) || durationMs <= 0) {
          return message.reply({
            embeds: [errorEmbed(
              'Invalid duration.\n' +
              'Examples: `30` (seconds), `30s`, `5m`, `2h`, `1h30m`\n' +
              'To disable: `!slowmode off` or `!slowmode 0`'
            )]
          });
        }
        seconds = Math.round(durationMs / 1000);
      }

      const MAX_SLOWMODE = 21600; // Discord hard cap = 6 hours
      if (seconds < 1 || seconds > MAX_SLOWMODE) {
        return message.reply({
          embeds: [errorEmbed(`Duration must be between **1s** and **6h** (${MAX_SLOWMODE}s max).`)]
        });
      }

      await message.channel.setRateLimitPerUser(seconds);
      message.reply({
        embeds: [successEmbed(`🐌 Slowmode set to **${formatDuration(seconds * 1000)}** in this channel.`)]
      });
    }
  },

  lock: {
    category: 'Moderation',
    description: 'Lock a channel',
    async execute(message) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
      message.reply({ embeds: [embed('🔒 Channel locked', 'No one can send messages anymore.', COLORS.mod)] });
    }
  },

  unlock: {
    category: 'Moderation',
    description: 'Unlock a channel',
    async execute(message) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });
      message.reply({ embeds: [embed('🔓 Channel unlocked', 'Members can send messages again.', COLORS.success)] });
    }
  },

  addrole: {
    category: 'Moderation',
    description: 'Add a role to a member',
    usage: '!addrole @member @role',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const member = message.mentions.members.first();
      const role = message.mentions.roles.first();
      if (!member || !role) return message.reply({ embeds: [errorEmbed('Mention a member and a role.')] });
      await member.roles.add(role);
      message.reply({ embeds: [successEmbed(`Role **${role.name}** added to **${member.user.tag}**.`)] });
    }
  },

  removerole: {
    category: 'Moderation',
    description: 'Remove a role from a member',
    usage: '!removerole @member @role',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const member = message.mentions.members.first();
      const role = message.mentions.roles.first();
      if (!member || !role) return message.reply({ embeds: [errorEmbed('Mention a member and a role.')] });
      await member.roles.remove(role);
      message.reply({ embeds: [successEmbed(`Role **${role.name}** removed from **${member.user.tag}**.`)] });
    }
  },

  nickname: {
    category: 'Moderation',
    description: 'Change a member\'s nickname',
    usage: '!nickname @member [nickname]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageNicknames)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const member = message.mentions.members.first();
      if (!member) return message.reply({ embeds: [errorEmbed('Mention a member.')] });
      const nick = args.slice(1).join(' ') || null;
      await member.setNickname(nick);
      message.reply({ embeds: [successEmbed(`**${member.user.tag}**'s nickname changed to **${nick || 'reset'}**.`)] });
    }
  },

  unban: {
    category: 'Moderation',
    description: 'Unban a user',
    usage: '!unban [ID]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      if (!args[0]) return message.reply({ embeds: [errorEmbed('Provide a user ID.')] });
      try {
        await message.guild.members.unban(args[0]);
        message.reply({ embeds: [successEmbed(`User \`${args[0]}\` unbanned.`)] });
      } catch {
        message.reply({ embeds: [errorEmbed('Unable to unban this user.')] });
      }
    }
  },

  banlist: {
    category: 'Moderation',
    description: 'List of banned users',
    async execute(message) {
      if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const bans = await message.guild.bans.fetch();
      if (!bans.size) return message.reply({ embeds: [embed('📋 Banned users', 'No banned users.', COLORS.info)] });
      const list = bans.map(b => `\`${b.user.tag}\` — ${b.reason || 'No reason'}`).slice(0, 20).join('\n');
      message.reply({ embeds: [embed(`📋 Banned users (${bans.size})`, list, COLORS.mod)] });
    }
  },

  // ══════════════ 📊 XP & LEVELS (Arcane) ══════════════
  rank: {
    category: 'Levels',
    description: 'View your level and XP',
    usage: '!rank [@member]',
    async execute(message, args) {
      const user = message.mentions.users.first() || message.author;
      const member = message.guild.members.cache.get(user.id);
      const data = await getXP(user.id, message.guild.id);
      const maxed = data.level >= MAX_LEVEL;
      const xpNeeded = data.level * 100 + 100;
      const xpCurrent = data.xp;

      // Progress bar (10 blocks)
      const progress = maxed ? 10 : Math.floor((xpCurrent / xpNeeded) * 10);
      const bar = '█'.repeat(progress) + '░'.repeat(10 - progress);
      const percent = maxed ? 100 : Math.floor((xpCurrent / xpNeeded) * 100);

      // Online = green, offline/absent = red
      const presence = member?.presence?.status;
      const isOnline = presence === 'online' || presence === 'idle' || presence === 'dnd';
      const statusColor = isOnline ? 0x57F287 : 0xED4245;
      const statusEmoji = isOnline ? '🟢' : '🔴';

      // Guild rank
      const allData = await db.all();
      const guildData = allData
        .filter(e => e.id.startsWith(`xp_${message.guild.id}_`))
        .map(e => ({ userId: e.id.split('_')[2], ...e.value }))
        .sort((a, b) => b.level - a.level || b.xp - a.xp);
      const rank = guildData.findIndex(d => d.userId === user.id) + 1;

      const e = new EmbedBuilder()
        .setAuthor({ name: `📊 ${user.username}'s Stats`, iconURL: user.displayAvatarURL() })
        .setColor(statusColor)
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
          { name: 'Level', value: `**${data.level}** / ${MAX_LEVEL}`, inline: true },
          { name: 'Rank', value: rank ? `**#${rank}**` : 'N/A', inline: true },
          { name: 'Status', value: `${statusEmoji} ${isOnline ? 'Online' : 'Offline'}`, inline: true },
          { name: 'XP', value: maxed ? '`MAX`' : `\`${xpCurrent} / ${xpNeeded}\``, inline: true },
          { name: 'Progress', value: `\`[${bar}] ${percent}%\``, inline: false },
        )
        .setTimestamp();

      message.reply({ embeds: [e] });
    }
  },

  xp: {
    category: 'Levels',
    description: 'See how much XP you have and how much you need to level up',
    usage: '!xp [@member]',
    async execute(message, args) {
      const user = message.mentions.users.first() || message.author;
      const data = await getXP(user.id, message.guild.id);
      const maxed = data.level >= MAX_LEVEL;
      const xpNeeded = maxed ? 0 : data.level * 100 + 100;
      const xpRemaining = maxed ? 0 : xpNeeded - data.xp;
      const e = new EmbedBuilder()
        .setTitle(`✨ ${user.username}'s XP`)
        .setColor(COLORS.xp)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: '🏆 Current Level', value: `${data.level} / ${MAX_LEVEL}`, inline: true },
          { name: '✨ Current XP', value: maxed ? 'MAX LEVEL' : `${data.xp} / ${xpNeeded}`, inline: true },
          { name: '📈 XP to Next Level', value: maxed ? 'You\'ve reached the max level! 🎉' : `${xpRemaining} XP`, inline: false },
        )
        .setTimestamp();
      message.reply({ embeds: [e] });
    }
  },

  leaderboard: {
    category: 'Levels',
    description: 'Server XP leaderboard',
    async execute(message) {
      const allData = await db.all();
      const guildData = allData
        .filter(e => e.id.startsWith(`xp_${message.guild.id}_`))
        .map(e => ({ userId: e.id.split('_')[2], ...e.value }))
        .sort((a, b) => b.level - a.level || b.xp - a.xp)
        .slice(0, 10);
      if (!guildData.length) return message.reply({ embeds: [embed('🏆 Leaderboard', 'No data.', COLORS.xp)] });
      const medals = ['🥇', '🥈', '🥉'];
      const list = guildData.map((d, i) => {
        const user = client.users.cache.get(d.userId);
        return `${medals[i] || `**${i+1}.**`} ${user ? user.tag : `<@${d.userId}>`} — Lvl **${d.level}** (${d.xp} XP)`;
      }).join('\n');
      message.reply({ embeds: [embed('🏆 XP Leaderboard', list, COLORS.xp)] });
    }
  },

  setxp: {
    category: 'Levels',
    description: 'Set a member\'s XP (Admin)',
    usage: '!setxp @member [xp]',
    async execute(message, args) {
      if (message.author.id !== OWNER_ID && !message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const member = message.mentions.members.first();
      const xp = parseInt(args[1]);
      if (!member || isNaN(xp)) return message.reply({ embeds: [errorEmbed('Usage: !setxp @member [xp]')] });
      const key = `xp_${message.guild.id}_${member.id}`;
      const data = (await db.get(key)) || { xp: 0, level: 0 };
      data.xp = xp;
      await db.set(key, data);
      message.reply({ embeds: [successEmbed(`**${member.user.tag}**'s XP set to **${xp}**.`)] });
    }
  },

  givexp: {
    category: 'Levels',
    description: 'Give XP to a member (Admin)',
    usage: '!givexp @member [amount]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const member = message.mentions.members.first();
      const amount = parseInt(args[1]);
      if (!member || isNaN(amount)) return message.reply({ embeds: [errorEmbed('Usage: !givexp @member [amount]')] });
      const result = await addXP(member, amount);
      message.reply({ embeds: [successEmbed(`**${amount}** XP given to **${member.user.tag}**. Level: **${result.level}**`)] });
      if (result.leveledUp) {
        await announceLevelUp(message.guild, member.id, result.level, message.channel);
      }
    }
  },

  // ══════════════ 🎉 FUN ══════════════
  '8ball': {
    category: 'Fun',
    description: 'Ask the magic 8-ball a question',
    usage: '!8ball [question]',
    async execute(message, args) {
      const answers = [
        '✅ Absolutely!', '✅ Certainly yes.', '✅ Without a doubt.',
        '✅ Definitely.', '✅ You can rely on it.',
        '❓ Hard to say.', '❓ Try again later.', '❓ I can\'t predict that.',
        '❌ Don\'t count on it.', '❌ My answer is no.', '❌ My sources say no.', '❌ Very doubtful.'
      ];
      const rep = answers[Math.floor(Math.random() * answers.length)];
      message.reply({ embeds: [embed('🎱 Magic 8-Ball', `**Question:** ${args.join(' ') || '???'}\n**Answer:** ${rep}`, COLORS.primary)] });
    }
  },

  dice: {
    category: 'Fun',
    description: 'Roll a die',
    usage: '!dice [sides]',
    async execute(message, args) {
      const faces = parseInt(args[0]) || 6;
      if (faces < 2 || faces > 1000) return message.reply({ embeds: [errorEmbed('Number of sides must be between 2 and 1000.')] });
      const result = Math.floor(Math.random() * faces) + 1;
      message.reply({ embeds: [embed('🎲 Dice', `You rolled a d**${faces}** and got: **${result}**`, COLORS.primary)] });
    }
  },

  coinflip: {
    category: 'Fun',
    description: 'Flip a coin',
    async execute(message) {
      const result = Math.random() < 0.5 ? '🪙 Heads' : '🪙 Tails';
      message.reply({ embeds: [embed('🪙 Coin Flip', `Result: **${result}**`, COLORS.primary)] });
    }
  },

  rps: {
    category: 'Fun',
    description: 'Rock, Paper, Scissors',
    usage: '!rps [rock/paper/scissors]',
    async execute(message, args) {
      const choices = ['rock', 'paper', 'scissors'];
      const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
      const choice = args[0]?.toLowerCase();
      if (!choices.includes(choice)) return message.reply({ embeds: [errorEmbed('Choose: rock, paper or scissors.')] });
      const bot = choices[Math.floor(Math.random() * 3)];
      let result = '🤝 Tie!';
      if ((choice === 'rock' && bot === 'scissors') || (choice === 'paper' && bot === 'rock') || (choice === 'scissors' && bot === 'paper'))
        result = '🏆 You win!';
      else if (choice !== bot)
        result = '😔 You lose!';
      message.reply({ embeds: [embed('🎮 Rock Paper Scissors', `You: ${emojis[choice]} vs Me: ${emojis[bot]}\n\n**${result}**`, COLORS.primary)] });
    }
  },

  joke: {
    category: 'Fun',
    description: 'Random joke',
    async execute(message) {
      const jokes = [
        ['Why don\'t scientists trust atoms?', 'Because they make up everything!'],
        ['What do you call a fish wearing a bowtie?', 'Sofishticated.'],
        ['Why did the scarecrow win an award?', 'Because he was outstanding in his field!'],
        ['Why don\'t skeletons fight each other?', 'They don\'t have the guts.'],
        ['What do you call a bear with no teeth?', 'A gummy bear.'],
      ];
      const [setup, punchline] = jokes[Math.floor(Math.random() * jokes.length)];
      message.reply({ embeds: [embed('😂 Joke', `${setup}\n\n||${punchline}||`, COLORS.primary)] });
    }
  },

  meme: {
    category: 'Fun',
    description: 'Random meme',
    async execute(message) {
      try {
        const fetch = require('node-fetch');
        const res = await fetch('https://meme-api.com/gimme');
        const data = await res.json();
        const e = new EmbedBuilder().setTitle(data.title).setImage(data.url).setColor(COLORS.primary).setFooter({ text: `👍 ${data.ups} | r/${data.subreddit}` });
        message.reply({ embeds: [e] });
      } catch {
        message.reply({ embeds: [errorEmbed('Unable to load a meme.')] });
      }
    }
  },

  choose: {
    category: 'Fun',
    description: 'Choose between multiple options',
    usage: '!choose [option1] [option2] ...',
    async execute(message, args) {
      if (args.length < 2) return message.reply({ embeds: [errorEmbed('Give at least 2 options separated by spaces.')] });
      const choice = args[Math.floor(Math.random() * args.length)];
      message.reply({ embeds: [embed('🎯 Choice', `I chose: **${choice}**`, COLORS.primary)] });
    }
  },

  poll: {
    category: 'Fun',
    description: 'Create a poll',
    usage: '!poll [question]',
    async execute(message, args) {
      const question = args.join(' ');
      if (!question) return message.reply({ embeds: [errorEmbed('Provide a question.')] });
      const e = embed('📊 Poll', question, COLORS.primary);
      e.setFooter({ text: `Poll created by ${message.author.tag}` });
      const msg = await message.channel.send({ embeds: [e] });
      await msg.react('👍');
      await msg.react('👎');
      await msg.react('🤷');
      message.delete().catch(() => {});
    }
  },

  trivia: {
    category: 'Fun',
    description: 'General knowledge question',
    async execute(message) {
      try {
        const fetch = require('node-fetch');
        const res = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
        const data = await res.json();
        const q = data.results[0];
        const answers = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
        const letters = ['🇦', '🇧', '🇨', '🇩'];
        const e = embed(`❓ ${q.category}`, `**${q.question.replace(/&amp;/g, '&').replace(/&quot;/g, '"')}**\n\n${answers.map((a, i) => `${letters[i]} ${a}`).join('\n')}`, COLORS.primary);
        const msg = await message.reply({ embeds: [e] });
        answers.forEach((_, i) => msg.react(letters[i]));
      } catch {
        message.reply({ embeds: [errorEmbed('Unable to load a question.')] });
      }
    }
  },

  reverse: {
    category: 'Fun',
    description: 'Reverse a text',
    usage: '!reverse [text]',
    async execute(message, args) {
      const text = args.join(' ');
      if (!text) return message.reply({ embeds: [errorEmbed('Provide some text.')] });
      message.reply({ embeds: [embed('🔄 Reversed text', text.split('').reverse().join(''), COLORS.primary)] });
    }
  },

  mock: {
    category: 'Fun',
    description: 'Mock a text',
    usage: '!mock [text]',
    async execute(message, args) {
      const text = args.join(' ');
      if (!text) return message.reply({ embeds: [errorEmbed('Provide some text.')] });
      const result = text.split('').map((c, i) => i % 2 ? c.toUpperCase() : c.toLowerCase()).join('');
      message.reply({ embeds: [embed('🤡 Mock', result, COLORS.primary)] });
    }
  },

  ascii: {
    category: 'Fun',
    description: 'Text as letter emojis',
    usage: '!ascii [text]',
    async execute(message, args) {
      const text = args.join(' ').toLowerCase().slice(0, 20);
      if (!text) return message.reply({ embeds: [errorEmbed('Provide some text.')] });
      const result = text.split('').map(c => /[a-z]/.test(c) ? `:regional_indicator_${c}: ` : c === ' ' ? '   ' : c).join('');
      message.reply({ embeds: [embed('🔠 ASCII', result.slice(0, 4000), COLORS.primary)] });
    }
  },

  slap: {
    category: 'Fun',
    description: 'Slap someone',
    usage: '!slap @member',
    async execute(message, args) {
      const target = message.mentions.users.first();
      if (!target) return message.reply({ embeds: [errorEmbed('Mention someone.')] });
      message.reply({ embeds: [embed('👋 Slapped!', `**${message.author.username}** slapped **${target.username}**! 😵`, COLORS.primary)] });
    }
  },

  hug: {
    category: 'Fun',
    description: 'Give a hug',
    usage: '!hug @member',
    async execute(message, args) {
      const target = message.mentions.users.first();
      if (!target) return message.reply({ embeds: [errorEmbed('Mention someone.')] });
      message.reply({ embeds: [embed('🤗 Hug!', `**${message.author.username}** hugs **${target.username}**! 💕`, COLORS.success)] });
    }
  },

  ship: {
    category: 'Fun',
    description: 'Compatibility between two people',
    usage: '!ship @member1 @member2',
    async execute(message, args) {
      const u1 = message.mentions.users.first();
      const u2 = message.mentions.users.at(1) || message.author;
      const percent = Math.floor(Math.random() * 101);
      const hearts = '❤️'.repeat(Math.floor(percent / 10)) + '🖤'.repeat(10 - Math.floor(percent / 10));
      message.reply({ embeds: [embed('💘 Ship', `**${u1 ? u1.username : '???'}** + **${u2.username}**\n\n${hearts}\n\n**${percent}%** compatible!`, COLORS.error)] });
    }
  },

  // ══════════════ 🛠 UTILITIES ══════════════
  embed_cmd: {
    category: 'Utilities',
    description: 'Create a custom embed',
    usage: '!embed [title] | [description]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const [title, ...descParts] = args.join(' ').split('|');
      const desc = descParts.join('|').trim();
      if (!title) return message.reply({ embeds: [errorEmbed('Usage: !embed [title] | [description]')] });
      await message.channel.send({ embeds: [embed(title.trim(), desc || '\u200b', COLORS.primary)] });
      message.delete().catch(() => {});
    }
  },

  say: {
    category: 'Utilities',
    description: 'Make the bot say something',
    usage: '!say [message]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const text = args.join(' ');
      if (!text) return message.reply({ embeds: [errorEmbed('Provide a message.')] });
      await message.channel.send({ embeds: [embed('💬 Message', text, COLORS.primary)] });
      message.delete().catch(() => {});
    }
  },

  announce: {
    category: 'Utilities',
    description: 'Make an announcement',
    usage: '!announce [message]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const text = args.join(' ');
      const e = new EmbedBuilder()
        .setTitle('📢 Announcement')
        .setDescription(text)
        .setColor(COLORS.warning)
        .setFooter({ text: `By ${message.author.tag}` })
        .setTimestamp();
      message.channel.send({ content: '@here', embeds: [e] });
      message.delete().catch(() => {});
    }
  },

  remindme: {
    category: 'Utilities',
    description: 'Get reminded about something',
    usage: '!remindme [duration] [reminder]',
    async execute(message, args) {
      const duration = parseDuration(args[0]);
      if (!duration) return message.reply({ embeds: [errorEmbed('Invalid duration. E.g.: 10m, 1h, 2d')] });
      const reminder = args.slice(1).join(' ') || 'Reminder!';
      message.reply({ embeds: [successEmbed(`⏰ I'll remind you in **${formatDuration(duration)}**: ${reminder}`)] });
      setTimeout(() => {
        message.author.send({ embeds: [embed('⏰ Reminder!', reminder, COLORS.info)] }).catch(() => {
          message.channel.send({ content: `<@${message.author.id}>`, embeds: [embed('⏰ Reminder!', reminder, COLORS.info)] });
        });
      }, duration);
    }
  },

  calc: {
    category: 'Utilities',
    description: 'Calculator',
    usage: '!calc [expression]',
    async execute(message, args) {
      const expr = args.join(' ');
      if (!expr) return message.reply({ embeds: [errorEmbed('Provide an expression.')] });
      try {
        const result = Function('"use strict"; return (' + expr.replace(/[^0-9+\-*/().\s]/g, '') + ')')();
        message.reply({ embeds: [embed('🧮 Calculation', `**${expr}** = **${result}**`, COLORS.info)] });
      } catch {
        message.reply({ embeds: [errorEmbed('Invalid expression.')] });
      }
    }
  },

  channelinfo: {
    category: 'Utilities',
    description: 'Information about the current channel',
    async execute(message) {
      const c = message.channel;
      const e = embed(`📋 #${c.name}`, `**ID:** ${c.id}\n**Type:** ${c.type}\n**Created on:** <t:${Math.floor(c.createdTimestamp / 1000)}:D>\n**Topic:** ${c.topic || 'None'}`, COLORS.info);
      message.reply({ embeds: [e] });
    }
  },

  roleinfo: {
    category: 'Utilities',
    description: 'Information about a role',
    usage: '!roleinfo @role',
    async execute(message, args) {
      const role = message.mentions.roles.first();
      if (!role) return message.reply({ embeds: [errorEmbed('Mention a role.')] });
      const e = new EmbedBuilder()
        .setTitle(`🎭 ${role.name}`)
        .setColor(role.color || COLORS.primary)
        .addFields(
          { name: '🆔 ID', value: role.id, inline: true },
          { name: '👥 Members', value: `${role.members.size}`, inline: true },
          { name: '📌 Position', value: `${role.position}`, inline: true },
          { name: '🎨 Color', value: role.hexColor, inline: true },
          { name: '📌 Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
          { name: '👑 Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
        )
        .setTimestamp();
      message.reply({ embeds: [e] });
    }
  },

  perms: {
    category: 'Utilities',
    description: 'View a member\'s permissions',
    usage: '!perms [@member]',
    async execute(message, args) {
      const member = message.mentions.members.first() || message.member;
      const perms = member.permissions.toArray().map(p => `\`${p}\``).join(', ');
      message.reply({ embeds: [embed(`🔑 Permissions for ${member.user.tag}`, perms || 'None', COLORS.info)] });
    }
  },

  timestamp: {
    category: 'Utilities',
    description: 'Show Discord timestamps',
    usage: '!timestamp [date]',
    async execute(message, args) {
      const date = args.length ? new Date(args.join(' ')) : new Date();
      const unix = Math.floor(date.getTime() / 1000);
      if (isNaN(unix)) return message.reply({ embeds: [errorEmbed('Invalid date.')] });
      const formats = ['t', 'T', 'd', 'D', 'f', 'F', 'R'].map(f => `\`<t:${unix}:${f}>\` → <t:${unix}:${f}>`).join('\n');
      message.reply({ embeds: [embed('🕐 Timestamps', formats, COLORS.info)] });
    }
  },

  // ══════════════ ⚙️ CONFIG (Dyno) ══════════════
  setprefix: {
    category: 'Config',
    description: 'Change the bot\'s prefix on this server',
    usage: '!setprefix [prefix]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const newPrefix = args[0];
      if (!newPrefix) return message.reply({ embeds: [errorEmbed('Provide a prefix.')] });
      await db.set(`prefix_${message.guild.id}`, newPrefix);
      message.reply({ embeds: [successEmbed(`Prefix changed to \`${newPrefix}\``)] });
    }
  },

  setwelcome: {
    category: 'Config',
    description: 'Configure the welcome channel (fixed embed with mention + gold/black banner)',
    usage: '!setwelcome #channel',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply({ embeds: [errorEmbed('Mention a channel. Usage: !setwelcome #channel')] });
      await db.set(`welcome_${message.guild.id}`, channel.id);
      message.reply({ embeds: [successEmbed(`Welcome messages will be sent in <#${channel.id}>.`)] });
    }
  },

  setboost: {
    category: 'Config',
    description: 'Configure the server boost announcement channel',
    usage: '!setboost #channel',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply({ embeds: [errorEmbed('Mention a channel. Usage: !setboost #channel')] });
      await db.set(`boost_${message.guild.id}`, channel.id);
      message.reply({ embeds: [successEmbed(`Boost announcements will be sent in <#${channel.id}>.`)] });
    }
  },

  setgoodbye: {
    category: 'Config',
    description: 'Configure the goodbye channel (fixed embed with mention + gold/black banner)',
    usage: '!setgoodbye #channel',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply({ embeds: [errorEmbed('Mention a channel. Usage: !setgoodbye #channel')] });
      await db.set(`goodbye_${message.guild.id}`, channel.id);
      message.reply({ embeds: [successEmbed(`Goodbye messages will be sent in <#${channel.id}>.`)] });
    }
  },

  setlogchannel: {
    category: 'Config',
    description: 'Configure the server logs channel (Carl-bot style logging)',
    usage: '!setlogchannel #channel',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply({ embeds: [errorEmbed('Mention a channel. Usage: !setlogchannel #channel')] });
      await db.set(`logs_${message.guild.id}`, channel.id);
      message.reply({ embeds: [successEmbed(`Log channel set to <#${channel.id}>. I'll now log: deleted/edited/purged messages, joins, leaves, bans, unbans, timeouts, role changes, nickname/avatar/username updates, channel changes, role create/update/delete, voice activity, server updates, and emoji changes.`)] });
    }
  },

  removelogchannel: {
    category: 'Config',
    description: 'Disable the server logs channel',
    async execute(message) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      await db.delete(`logs_${message.guild.id}`);
      message.reply({ embeds: [successEmbed('Log channel disabled.')] });
    }
  },

  autorole: {
    category: 'Config',
    description: 'Automatic role on join',
    usage: '!autorole @role',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const role = message.mentions.roles.first();
      if (!role) {
        await db.delete(`autorole_${message.guild.id}`);
        return message.reply({ embeds: [successEmbed('Auto-role disabled.')] });
      }
      await db.set(`autorole_${message.guild.id}`, role.id);
      message.reply({ embeds: [successEmbed(`Auto-role: **${role.name}**`)] });
    }
  },

  setlevel: {
    category: 'Config',
    description: 'Channel where level-up announcements (1 to 100) are sent — pings the member + gold/black level banner',
    usage: '!setlevel #channel',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply({ embeds: [errorEmbed('Mention a channel. Usage: !setlevel #channel')] });
      await db.set(`levelup_${message.guild.id}`, channel.id);
      message.reply({ embeds: [successEmbed(`Level-up announcements will be sent in <#${channel.id}>.`)] });
    }
  },

  sticky: {
    category: 'Config',
    description: 'Posts a sticky trading-room message in one or more channels (StickyBot-style: auto-reposted after every new message)',
    usage: '!sticky #channel1 #channel2 ...',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const channels = [...message.mentions.channels.values()];
      if (!channels.length) return message.reply({ embeds: [errorEmbed('Mention at least one channel. Usage: !sticky #channel1 #channel2 ...')] });

      const results = [];
      for (const ch of channels) {
        try {
          const sentMsg = await ch.send({ embeds: [buildStickyMessage(ch.id)] });
          await db.set(`sticky_${message.guild.id}_${ch.id}`, { channelId: ch.id, messageId: sentMsg.id });
          results.push(`✅ <#${ch.id}>`);
        } catch (err) {
          results.push(`❌ <#${ch.id}> — ${err.message}`);
        }
      }
      message.reply({ embeds: [successEmbed(`Sticky message enabled in:\n${results.join('\n')}`)] });
    }
  },

  unsticky: {
    category: 'Config',
    description: 'Removes the sticky message from one or more channels',
    usage: '!unsticky #channel1 #channel2 ...',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const channels = [...message.mentions.channels.values()];
      if (!channels.length) return message.reply({ embeds: [errorEmbed('Mention at least one channel. Usage: !unsticky #channel1 #channel2 ...')] });

      for (const ch of channels) {
        const key = `sticky_${message.guild.id}_${ch.id}`;
        const data = await db.get(key);
        if (data?.messageId) {
          const msg = await ch.messages.fetch(data.messageId).catch(() => null);
          if (msg) await msg.delete().catch(() => {});
        }
        await db.delete(key);
      }
      message.reply({ embeds: [successEmbed(`Sticky message removed from: ${channels.map(c => `<#${c.id}>`).join(', ')}`)] });
    }
  },

  config: {
    category: 'Config',
    description: 'View the server configuration',
    async execute(message) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const g = message.guild.id;
      const welcome = await db.get(`welcome_${g}`);
      const goodbye = await db.get(`goodbye_${g}`);
      const logs = await db.get(`logs_${g}`);
      const autorole = await db.get(`autorole_${g}`);
      const levelup = await db.get(`levelup_${g}`);
      const prefix = await db.get(`prefix_${g}`);
      const e = new EmbedBuilder()
        .setTitle(`⚙️ ${message.guild.name}'s config`)
        .setColor(COLORS.info)
        .addFields(
          { name: '🔤 Prefix', value: prefix || PREFIX, inline: true },
          { name: '👋 Welcome', value: welcome ? `<#${welcome}>` : 'Not configured', inline: true },
          { name: '🚪 Goodbye', value: goodbye ? `<#${goodbye}>` : 'Not configured', inline: true },
          { name: '📋 Log Channel', value: logs ? `<#${logs}>` : 'Not configured (use !setlogchannel)', inline: true },
          { name: '🎭 Auto-role', value: autorole ? `<@&${autorole}>` : 'Not configured', inline: true },
          { name: '⭐ Level-up', value: levelup ? `<#${levelup}>` : 'Not configured', inline: true },
        )
        .setTimestamp();
      message.reply({ embeds: [e] });
    }
  },

  // ══════════════ 🎵 BASIC MUSIC ══════════════
  play: {
    category: 'Music',
    description: 'Play music (YouTube title)',
    usage: '!play [title]',
    async execute(message, args) {
      if (!message.member.voice.channel) return message.reply({ embeds: [errorEmbed('Join a voice channel.')] });
      const query = args.join(' ');
      if (!query) return message.reply({ embeds: [errorEmbed('Provide a title or YouTube link.')] });
      message.reply({ embeds: [embed('🎵 Music', `Searching for **${query}**...\n\n⚠️ Install \`@distube/distube\` for audio playback.`, COLORS.primary)] });
    }
  },

  // ══════════════ 🎉 GIVEAWAYS ══════════════
  gcreate: {
    category: 'Giveaway',
    description: 'Create a giveaway (attach an image to the message to include it)',
    usage: '!gcreate [winners] [duration] [prize]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const winners = parseInt(args[0]);
      const duration = parseDuration(args[1]);
      const prize = args.slice(2).join(' ');
      if (!winners || winners < 1 || !duration || !prize) {
        return message.reply({ embeds: [errorEmbed('Usage: !gcreate [winners] [duration] [prize]\nEx: `!gcreate 1 1h Discord Nitro` (attach an image if you want one)')] });
      }
      const endTime = Date.now() + duration;
      const image = message.attachments.first()?.url || null;

      const e = new EmbedBuilder()
        .setTitle('🎉 GIVEAWAY 🎉')
        .setDescription(`**Prize:** ${prize}\n**Winners:** ${winners}\n**Ends:** <t:${Math.floor(endTime / 1000)}:R> (<t:${Math.floor(endTime / 1000)}:F>)\n**Hosted by:** <@${message.author.id}>\n\nReact with 🎉 to enter!`)
        .setColor(COLORS.xp)
        .setTimestamp(endTime);
      if (image) e.setImage(image);

      const giveawayMsg = await message.channel.send({ embeds: [e] });
      await giveawayMsg.react('🎉');

      await db.set(`giveaway_${giveawayMsg.id}`, {
        guildId: message.guild.id,
        channelId: message.channel.id,
        prize,
        winners,
        endTime,
        hostId: message.author.id,
        ended: false,
        winnerIds: [],
      });

      message.reply({ embeds: [successEmbed(`Giveaway created! 🎉\n**ID:** \`${giveawayMsg.id}\`\nUse this ID with \`!gend\`, \`!gdelete\` or \`!greroll\`.`)] });
      message.delete().catch(() => {});
    }
  },

  gend: {
    category: 'Giveaway',
    description: 'End a giveaway immediately and pick the winner(s)',
    usage: '!gend [giveawayID]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const giveawayId = args[0];
      if (!giveawayId) return message.reply({ embeds: [errorEmbed('Usage: !gend [giveawayID]')] });
      const data = await db.get(`giveaway_${giveawayId}`);
      if (!data) return message.reply({ embeds: [errorEmbed('Giveaway not found. Check the ID.')] });
      if (data.ended) return message.reply({ embeds: [errorEmbed('This giveaway has already ended.')] });
      await endGiveaway(giveawayId);
      message.reply({ embeds: [successEmbed('Giveaway ended! Check the announcement above. 🎉')] });
    }
  },

  gdelete: {
    category: 'Giveaway',
    description: 'Delete a giveaway',
    usage: '!gdelete [giveawayID]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const giveawayId = args[0];
      if (!giveawayId) return message.reply({ embeds: [errorEmbed('Usage: !gdelete [giveawayID]')] });
      const data = await db.get(`giveaway_${giveawayId}`);
      if (!data) return message.reply({ embeds: [errorEmbed('Giveaway not found. Check the ID.')] });
      const channel = message.guild.channels.cache.get(data.channelId);
      if (channel) {
        const msg = await channel.messages.fetch(giveawayId).catch(() => null);
        if (msg) await msg.delete().catch(() => {});
      }
      await db.delete(`giveaway_${giveawayId}`);
      message.reply({ embeds: [successEmbed('Giveaway deleted.')] });
    }
  },

  greroll: {
    category: 'Giveaway',
    description: 'Reroll a new winner for an ended giveaway',
    usage: '!greroll [giveawayID]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const giveawayId = args[0];
      if (!giveawayId) return message.reply({ embeds: [errorEmbed('Usage: !greroll [giveawayID]')] });
      const data = await db.get(`giveaway_${giveawayId}`);
      if (!data) return message.reply({ embeds: [errorEmbed('Giveaway not found. Check the ID.')] });
      if (!data.ended) return message.reply({ embeds: [errorEmbed('This giveaway has not ended yet. Use `!gend` first.')] });
      const channel = message.guild.channels.cache.get(data.channelId);
      if (!channel) return message.reply({ embeds: [errorEmbed('Original channel not found.')] });
      const winners = await pickGiveawayWinners(channel, giveawayId, data.winners);
      data.winnerIds = winners;
      await db.set(`giveaway_${giveawayId}`, data);
      const winnerText = winners.length ? winners.map(id => `<@${id}>`).join(', ') : 'No valid participants 😢';
      const e = new EmbedBuilder()
        .setTitle('🔄 Giveaway Rerolled')
        .setDescription(`**Prize:** ${data.prize}\n**New winner(s):** ${winnerText}`)
        .setColor(COLORS.info)
        .setFooter({ text: `Giveaway ID: ${giveawayId}` })
        .setTimestamp();
      message.channel.send({ embeds: [e] });
    }
  },

  // ══════════════ 🎰 ECONOMY ══════════════
  balance: {
    category: 'Economy',
    description: 'View your balance',
    usage: '!balance [@member]',
    async execute(message, args) {
      const user = message.mentions.users.first() || message.author;
      const coins = (await db.get(`coins_${message.guild.id}_${user.id}`)) || 0;
      message.reply({ embeds: [embed('💰 Balance', `**${user.username}** has **${coins.toLocaleString()}** 💎`, COLORS.xp)] });
    }
  },

  daily: {
    category: 'Economy',
    description: 'Daily reward',
    async execute(message) {
      const key = `daily_${message.guild.id}_${message.author.id}`;
      const last = await db.get(key);
      const now = Date.now();
      if (last && now - last < 86400000) {
        const remaining = 86400000 - (now - last);
        return message.reply({ embeds: [errorEmbed(`Come back in **${formatDuration(remaining)}**.`)] });
      }
      const amount = Math.floor(Math.random() * 200) + 50;
      const coinKey = `coins_${message.guild.id}_${message.author.id}`;
      const current = (await db.get(coinKey)) || 0;
      await db.set(coinKey, current + amount);
      await db.set(key, now);
      message.reply({ embeds: [embed('🎁 Daily', `You received **${amount}** 💎!\nBalance: **${current + amount}** 💎`, COLORS.success)] });
    }
  },

  weekly: {
    category: 'Economy',
    description: 'Weekly reward',
    async execute(message) {
      const key = `weekly_${message.guild.id}_${message.author.id}`;
      const last = await db.get(key);
      const now = Date.now();
      if (last && now - last < 604800000) {
        const remaining = 604800000 - (now - last);
        return message.reply({ embeds: [errorEmbed(`Come back in **${formatDuration(remaining)}**.`)] });
      }
      const amount = Math.floor(Math.random() * 1000) + 500;
      const coinKey = `coins_${message.guild.id}_${message.author.id}`;
      const current = (await db.get(coinKey)) || 0;
      await db.set(coinKey, current + amount);
      await db.set(key, now);
      message.reply({ embeds: [embed('🗓 Weekly', `You received **${amount}** 💎!\nBalance: **${current + amount}** 💎`, COLORS.success)] });
    }
  },

  work: {
    category: 'Economy',
    description: 'Work to earn coins',
    async execute(message) {
      const key = `work_${message.guild.id}_${message.author.id}`;
      const last = await db.get(key);
      const now = Date.now();
      if (last && now - last < 3600000) {
        const remaining = 3600000 - (now - last);
        return message.reply({ embeds: [errorEmbed(`Come back in **${formatDuration(remaining)}**.`)] });
      }
      const jobs = ['🍕 Pizza maker', '💻 Developer', '🎨 Artist', '🚗 Driver', '🏥 Doctor'];
      const job = jobs[Math.floor(Math.random() * jobs.length)];
      const amount = Math.floor(Math.random() * 100) + 20;
      const coinKey = `coins_${message.guild.id}_${message.author.id}`;
      const current = (await db.get(coinKey)) || 0;
      await db.set(coinKey, current + amount);
      await db.set(key, now);
      message.reply({ embeds: [embed('💼 Work', `You work as a **${job}** and earn **${amount}** 💎!`, COLORS.success)] });
    }
  },

  pay: {
    category: 'Economy',
    description: 'Send coins to a member',
    usage: '!pay @member [amount]',
    async execute(message, args) {
      const target = message.mentions.users.first();
      const amount = parseInt(args[1]);
      if (!target || isNaN(amount) || amount <= 0) return message.reply({ embeds: [errorEmbed('Usage: !pay @member [amount]')] });
      const fromKey = `coins_${message.guild.id}_${message.author.id}`;
      const toKey = `coins_${message.guild.id}_${target.id}`;
      const from = (await db.get(fromKey)) || 0;
      if (from < amount) return message.reply({ embeds: [errorEmbed('Insufficient balance.')] });
      await db.set(fromKey, from - amount);
      const to = (await db.get(toKey)) || 0;
      await db.set(toKey, to + amount);
      message.reply({ embeds: [successEmbed(`You sent **${amount}** 💎 to **${target.username}**.`)] });
    }
  },

  slots: {
    category: 'Economy',
    description: 'Slot machine',
    usage: '!slots [bet]',
    async execute(message, args) {
      const bet = parseInt(args[0]) || 10;
      const coinKey = `coins_${message.guild.id}_${message.author.id}`;
      const current = (await db.get(coinKey)) || 0;
      if (current < bet) return message.reply({ embeds: [errorEmbed('Insufficient balance.')] });
      const symbols = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎'];
      const reels = Array.from({ length: 3 }, () => symbols[Math.floor(Math.random() * symbols.length)]);
      const display = `| ${reels.join(' | ')} |`;
      let win = 0;
      if (reels[0] === reels[1] && reels[1] === reels[2]) {
        win = reels[0] === '💎' ? bet * 10 : bet * 5;
      } else if (reels[0] === reels[1] || reels[1] === reels[2]) {
        win = bet * 2;
      }
      const net = win - bet;
      await db.set(coinKey, current + net);
      message.reply({ embeds: [embed('🎰 Slots', `${display}\n\n${win > 0 ? `🏆 Won **${win}** 💎!` : `😔 Lost **${bet}** 💎.`}\nBalance: **${current + net}** 💎`, win > 0 ? COLORS.success : COLORS.error)] });
    }
  },

  richlist: {
    category: 'Economy',
    description: 'Richest members leaderboard',
    async execute(message) {
      const allData = await db.all();
      const guildData = allData
        .filter(e => e.id.startsWith(`coins_${message.guild.id}_`))
        .map(e => ({ userId: e.id.split('_')[2], coins: e.value }))
        .sort((a, b) => b.coins - a.coins)
        .slice(0, 10);
      if (!guildData.length) return message.reply({ embeds: [embed('💰 Richest', 'No data.', COLORS.xp)] });
      const medals = ['🥇', '🥈', '🥉'];
      const list = guildData.map((d, i) => {
        const user = client.users.cache.get(d.userId);
        return `${medals[i] || `**${i+1}.**`} ${user ? user.tag : `<@${d.userId}>`} — **${d.coins.toLocaleString()}** 💎`;
      }).join('\n');
      message.reply({ embeds: [embed('💰 Richest', list, COLORS.xp)] });
    }
  },

  // ══════════════ 🎭 REACTION ROLES (Circle) ══════════════
  reactionrole: {
    category: 'ReactionRoles',
    description: 'Create a reaction role message',
    usage: '!reactionrole #channel [emoji] [@role] [description]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) return message.reply({ embeds: [errorEmbed('Insufficient permission.')] });
      const channel = message.mentions.channels.first();
      const role = message.mentions.roles.first();
      if (!channel || !role || !args[1]) return message.reply({ embeds: [errorEmbed('Usage: !reactionrole #channel [emoji] @role')] });
      const emoji = args[1];
      const e = embed('🎭 Reaction Roles', `React with ${emoji} to get the **${role.name}** role!`, COLORS.primary);
      const msg = await channel.send({ embeds: [e] });
      await msg.react(emoji);
      await db.set(`rr_${msg.id}`, { roleId: role.id, emoji });
      message.reply({ embeds: [successEmbed(`Reaction role message created in <#${channel.id}>.`)] });
    }
  },

  // ══════════════ 🧑‍💻 OWNER ══════════════
  eval: {
    category: 'Owner',
    description: 'Execute JavaScript code (Owner)',
    usage: '!eval [code]',
    async execute(message, args) {
      if (message.author.id !== OWNER_ID) return message.reply({ embeds: [errorEmbed('This command is owner-only.')] });
      try {
        const code = args.join(' ');
        let result = eval(code);
        if (result instanceof Promise) result = await result;
        result = typeof result !== 'string' ? JSON.stringify(result, null, 2) : result;
        if (result?.length > 1900) result = result.slice(0, 1900) + '...';
        message.reply({ embeds: [embed('✅ Eval', `\`\`\`js\n${result}\`\`\``, COLORS.success)] });
      } catch (e) {
        message.reply({ embeds: [errorEmbed(`\`\`\`${e.message}\`\`\``)] });
      }
    }
  },

  reload: {
    category: 'Owner',
    description: 'Reload the bot',
    async execute(message) {
      if (message.author.id !== OWNER_ID) return;
      message.reply({ embeds: [successEmbed('Reloading...')] }).then(() => process.exit(0));
    }
  },

  guilds: {
    category: 'Owner',
    description: 'List of servers the bot is in',
    async execute(message) {
      if (message.author.id !== OWNER_ID) return;
      const list = client.guilds.cache.map(g => `**${g.name}** — ${g.memberCount} members`).join('\n');
      message.reply({ embeds: [embed(`🌐 Servers (${client.guilds.cache.size})`, list.slice(0, 4000) || 'None', COLORS.info)] });
    }
  },

};

// Command aliases
commands['clear'] = { ...commands.purge, description: 'Alias for !purge' };
commands['lb'] = { ...commands.leaderboard, description: 'Alias for !leaderboard' };
commands['bal'] = { ...commands.balance, description: 'Alias for !balance' };

// ─── Event: Message ───────────────────────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  // Message stats tracking (for !ms)
  await trackMessage(message.guild.id, message.author.id);

  // Auto XP
  if (Math.random() < 0.5) {
    const result = await addXP(message.member, Math.floor(Math.random() * 10) + 5);
    if (result.leveledUp) {
      await announceLevelUp(message.guild, message.author.id, result.level, message.channel);
    }
  }

  const guildPrefix = (await db.get(`prefix_${message.guild.id}`)) || PREFIX;

  // Sticky messages: repost at the bottom of the channel after every new message
  const stickyData = await db.get(`sticky_${message.guild.id}_${message.channel.id}`);
  if (stickyData) repostSticky(message.channel, message.guild.id);

  if (!message.content.startsWith(guildPrefix)) return;

  const args = message.content.slice(guildPrefix.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();
  const command = commands[commandName];
  if (!command) return;

  // Cooldown
  const cd = cooldowns.get(`${message.author.id}_${commandName}`);
  if (cd && Date.now() < cd) return message.reply({ embeds: [errorEmbed(`Wait \`${Math.ceil((cd - Date.now()) / 1000)}s\`.`)] });
  cooldowns.set(`${message.author.id}_${commandName}`, Date.now() + 3000);

  try {
    await command.execute(message, args);
  } catch (err) {
    console.error(`[Error] ${commandName}:`, err);
    message.reply({ embeds: [errorEmbed('An error occurred.')] });
  }
});

// ─── Event: Logs (Carl-bot style) ─────────────────────────────────────────────

// 🗑 Deleted messages
client.on('messageDelete', async (message) => {
  if (!message.guild || message.author?.bot) return;
  const channel = await getLogChannel(message.guild);
  if (!channel) return;
  const e = logEmbed('🗑️ Message Deleted')
    .addFields(
      { name: 'Author', value: message.author ? `${message.author.tag} (${message.author.id})` : 'Unknown', inline: false },
      { name: 'Channel', value: `<#${message.channelId}>`, inline: false },
      { name: 'Content', value: message.content?.slice(0, 1000) || '*No text content (embed/attachment)*', inline: false },
    );
  channel.send({ embeds: [e] }).catch(() => {});
});

// 🗑 Purged / bulk deleted messages
client.on('messageDeleteBulk', async (messages) => {
  const first = messages.first();
  if (!first?.guild) return;
  const channel = await getLogChannel(first.guild);
  if (!channel) return;
  const e = logEmbed('🧹 Messages Purged')
    .addFields(
      { name: 'Channel', value: `<#${first.channelId}>`, inline: true },
      { name: 'Amount', value: `${messages.size}`, inline: true },
    );
  channel.send({ embeds: [e] }).catch(() => {});
});

// ✏️ Edited messages
client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (!newMessage.guild || newMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;
  const channel = await getLogChannel(newMessage.guild);
  if (!channel) return;
  const e = logEmbed('✏️ Message Edited', COLORS.warning)
    .addFields(
      { name: 'Author', value: `${newMessage.author.tag} (${newMessage.author.id})`, inline: false },
      { name: 'Channel', value: `<#${newMessage.channelId}>`, inline: false },
      { name: 'Before', value: oldMessage.content?.slice(0, 500) || '*Empty*', inline: false },
      { name: 'After', value: newMessage.content?.slice(0, 500) || '*Empty*', inline: false },
    );
  channel.send({ embeds: [e] }).catch(() => {});
});

// 📥 Member joins
client.on('guildMemberAdd', async (member) => {
  // Welcome message
  const welcomeChannelId = await db.get(`welcome_${member.guild.id}`);
  if (welcomeChannelId) {
    const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
    if (welcomeChannel) {
      try {
        const buffer = await generateWelcomeImage();
        const attachment = new AttachmentBuilder(buffer, { name: 'welcome.png' });
        const e = new EmbedBuilder()
          .setTitle('👋 Welcome To Wsp Service And Middleman')
          .setDescription(`<@${member.id}> Welcome To Wsp Service And Middleman`)
          .setColor(0xD4AF37)
          .setImage('attachment://welcome.png')
          .setTimestamp();
        welcomeChannel.send({ embeds: [e], files: [attachment] }).catch(() => {});
      } catch (err) {
        console.error('[Welcome image] Error:', err);
      }
    }
  }
  // Auto-role
  const autorole = await db.get(`autorole_${member.guild.id}`);
  if (autorole) {
    const role = member.guild.roles.cache.get(autorole);
    if (role) member.roles.add(role).catch(() => {});
  }
  // Log
  const channel = await getLogChannel(member.guild);
  if (channel) {
    const e = logEmbed('📥 Member Joined', COLORS.success)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: 'User', value: `${member.user.tag} (${member.id})`, inline: false },
        { name: 'Account created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: false },
      );
    channel.send({ embeds: [e] }).catch(() => {});
  }
});

// 🚪 Member leaves
client.on('guildMemberRemove', async (member) => {
  // Goodbye message
  const goodbyeChannelId = await db.get(`goodbye_${member.guild.id}`);
  if (goodbyeChannelId) {
    const goodbyeChannel = member.guild.channels.cache.get(goodbyeChannelId);
    if (goodbyeChannel) {
      try {
        const buffer = await generateGoodbyeImage();
        const attachment = new AttachmentBuilder(buffer, { name: 'goodbye.png' });
        const e = new EmbedBuilder()
          .setTitle('👋 Goodbye')
          .setDescription(`<@${member.id}> Goodbye I Hope You Will Comeback Soon`)
          .setColor(0xD4AF37)
          .setImage('attachment://goodbye.png')
          .setTimestamp();
        goodbyeChannel.send({ embeds: [e], files: [attachment] }).catch(() => {});
      } catch (err) {
        console.error('[Goodbye image] Error:', err);
      }
    }
  }
  const channel = await getLogChannel(member.guild);
  if (channel) {
    const e = logEmbed('📤 Member Left', COLORS.warning)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: 'User', value: `${member.user.tag} (${member.id})`, inline: false },
        { name: 'Roles', value: member.roles?.cache?.filter(r => r.id !== member.guild.id).map(r => r.name).join(', ') || 'None', inline: false },
      );
    channel.send({ embeds: [e] }).catch(() => {});
  }
});

// 🔨 Bans
client.on('guildBanAdd', async (ban) => {
  const channel = await getLogChannel(ban.guild);
  if (!channel) return;
  const e = logEmbed('🔨 Member Banned', COLORS.mod)
    .addFields(
      { name: 'User', value: `${ban.user.tag} (${ban.user.id})`, inline: false },
      { name: 'Reason', value: ban.reason || 'None', inline: false },
    );
  channel.send({ embeds: [e] }).catch(() => {});
});

// ✅ Unbans
client.on('guildBanRemove', async (ban) => {
  const channel = await getLogChannel(ban.guild);
  if (!channel) return;
  const e = logEmbed('✅ Member Unbanned', COLORS.success)
    .addFields({ name: 'User', value: `${ban.user.tag} (${ban.user.id})`, inline: false });
  channel.send({ embeds: [e] }).catch(() => {});
});

// 💎 Server boost announcements
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  if (!oldMember.premiumSince && newMember.premiumSince) {
    const boostChannelId = await db.get(`boost_${newMember.guild.id}`);
    if (!boostChannelId) return;
    const boostChannel = newMember.guild.channels.cache.get(boostChannelId);
    if (!boostChannel) return;
    const e = new EmbedBuilder()
      .setTitle('💎 Thank You For Boosting the server!')
      .setDescription(`<@${newMember.id}> just boosted **${newMember.guild.name}**! 🎉\nThe server is now at **${newMember.guild.premiumSubscriptionCount || 0}** boost(s) (Tier ${newMember.guild.premiumTier}).`)
      .setColor(0xF47FFF)
      .setThumbnail(newMember.user.displayAvatarURL())
      .setTimestamp();
    boostChannel.send({ embeds: [e] }).catch(() => {});
  }
});

// 🎭 Role changes, nicknames, timeouts
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const channel = await getLogChannel(newMember.guild);
  if (!channel) return;

  // Nickname change
  if (oldMember.nickname !== newMember.nickname) {
    const e = logEmbed('📝 Nickname Updated', COLORS.warning)
      .addFields(
        { name: 'User', value: `${newMember.user.tag} (${newMember.id})`, inline: false },
        { name: 'Before', value: oldMember.nickname || '*None*', inline: true },
        { name: 'After', value: newMember.nickname || '*None*', inline: true },
      );
    channel.send({ embeds: [e] }).catch(() => {});
  }

  // Role changes
  const oldRoles = oldMember.roles.cache;
  const newRoles = newMember.roles.cache;
  const addedRoles = newRoles.filter(r => !oldRoles.has(r.id));
  const removedRoles = oldRoles.filter(r => !newRoles.has(r.id));
  if (addedRoles.size > 0 || removedRoles.size > 0) {
    const e = logEmbed('🎭 Member Roles Updated', COLORS.info)
      .addFields({ name: 'User', value: `${newMember.user.tag} (${newMember.id})`, inline: false });
    if (addedRoles.size > 0) e.addFields({ name: '➕ Added', value: addedRoles.map(r => r.name).join(', '), inline: false });
    if (removedRoles.size > 0) e.addFields({ name: '➖ Removed', value: removedRoles.map(r => r.name).join(', '), inline: false });
    channel.send({ embeds: [e] }).catch(() => {});
  }

  // Timeout changes
  const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
  const newTimeout = newMember.communicationDisabledUntilTimestamp;
  if (oldTimeout !== newTimeout) {
    if (newTimeout && newTimeout > Date.now()) {
      const e = logEmbed('🔇 Member Timed Out', COLORS.mod)
        .addFields(
          { name: 'User', value: `${newMember.user.tag} (${newMember.id})`, inline: false },
          { name: 'Until', value: `<t:${Math.floor(newTimeout / 1000)}:F>`, inline: false },
        );
      channel.send({ embeds: [e] }).catch(() => {});
    } else if (oldTimeout) {
      const e = logEmbed('🔊 Timeout Removed', COLORS.success)
        .addFields({ name: 'User', value: `${newMember.user.tag} (${newMember.id})`, inline: false });
      channel.send({ embeds: [e] }).catch(() => {});
    }
  }
});

// 👤 Username / avatar changes (global, so check shared guilds)
client.on('userUpdate', async (oldUser, newUser) => {
  for (const guild of client.guilds.cache.values()) {
    const member = guild.members.cache.get(newUser.id);
    if (!member) continue;
    const channel = await getLogChannel(guild);
    if (!channel) continue;

    if (oldUser.username !== newUser.username) {
      const e = logEmbed('👤 Username Updated', COLORS.warning)
        .addFields(
          { name: 'User', value: `${newUser.id}`, inline: false },
          { name: 'Before', value: oldUser.username, inline: true },
          { name: 'After', value: newUser.username, inline: true },
        );
      channel.send({ embeds: [e] }).catch(() => {});
    }

    if (oldUser.displayAvatarURL() !== newUser.displayAvatarURL()) {
      const e = logEmbed('🖼️ Avatar Updated', COLORS.warning)
        .setThumbnail(newUser.displayAvatarURL())
        .addFields({ name: 'User', value: `${newUser.tag} (${newUser.id})`, inline: false });
      channel.send({ embeds: [e] }).catch(() => {});
    }
  }
});

// 🔊 Voice activity
client.on('voiceStateUpdate', async (oldState, newState) => {
  const guild = newState.guild || oldState.guild;
  const channel = await getLogChannel(guild);
  if (!channel) return;
  const member = newState.member || oldState.member;

  if (!oldState.channelId && newState.channelId) {
    const e = logEmbed('🔊 Voice Join', COLORS.success)
      .addFields(
        { name: 'User', value: `${member.user.tag}`, inline: true },
        { name: 'Channel', value: `<#${newState.channelId}>`, inline: true },
      );
    channel.send({ embeds: [e] }).catch(() => {});
  } else if (oldState.channelId && !newState.channelId) {
    const e = logEmbed('🔇 Voice Leave', COLORS.warning)
      .addFields(
        { name: 'User', value: `${member.user.tag}`, inline: true },
        { name: 'Channel', value: `<#${oldState.channelId}>`, inline: true },
      );
    channel.send({ embeds: [e] }).catch(() => {});
  } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    const e = logEmbed('🔀 Voice Move', COLORS.info)
      .addFields(
        { name: 'User', value: `${member.user.tag}`, inline: true },
        { name: 'From', value: `<#${oldState.channelId}>`, inline: true },
        { name: 'To', value: `<#${newState.channelId}>`, inline: true },
      );
    channel.send({ embeds: [e] }).catch(() => {});
  }
});

// 📁 Channel create/update/delete
client.on('channelCreate', async (ch) => {
  if (!ch.guild) return;
  const channel = await getLogChannel(ch.guild);
  if (!channel) return;
  channel.send({ embeds: [logEmbed('📁 Channel Created', COLORS.success).addFields({ name: 'Channel', value: `${ch.name} (${ch.id})`, inline: false })] }).catch(() => {});
});

client.on('channelDelete', async (ch) => {
  if (!ch.guild) return;
  const channel = await getLogChannel(ch.guild);
  if (!channel) return;
  channel.send({ embeds: [logEmbed('🗑️ Channel Deleted', COLORS.mod).addFields({ name: 'Channel', value: `${ch.name} (${ch.id})`, inline: false })] }).catch(() => {});
});

client.on('channelUpdate', async (oldCh, newCh) => {
  if (!newCh.guild) return;
  const channel = await getLogChannel(newCh.guild);
  if (!channel) return;
  if (oldCh.name === newCh.name && oldCh.topic === newCh.topic) return;
  const e = logEmbed('🔧 Channel Updated', COLORS.warning)
    .addFields({ name: 'Channel', value: `<#${newCh.id}>`, inline: false });
  if (oldCh.name !== newCh.name) e.addFields({ name: 'Name', value: `${oldCh.name} → ${newCh.name}`, inline: false });
  if (oldCh.topic !== newCh.topic) e.addFields({ name: 'Topic', value: `${oldCh.topic || '*None*'} → ${newCh.topic || '*None*'}`, inline: false });
  channel.send({ embeds: [e] }).catch(() => {});
});

// 🎭 Role create/update/delete
client.on('roleCreate', async (role) => {
  const channel = await getLogChannel(role.guild);
  if (!channel) return;
  channel.send({ embeds: [logEmbed('🎭 Role Created', COLORS.success).addFields({ name: 'Role', value: `${role.name} (${role.id})`, inline: false })] }).catch(() => {});
});

client.on('roleDelete', async (role) => {
  const channel = await getLogChannel(role.guild);
  if (!channel) return;
  channel.send({ embeds: [logEmbed('🗑️ Role Deleted', COLORS.mod).addFields({ name: 'Role', value: `${role.name} (${role.id})`, inline: false })] }).catch(() => {});
});

client.on('roleUpdate', async (oldRole, newRole) => {
  const channel = await getLogChannel(newRole.guild);
  if (!channel) return;
  if (oldRole.name === newRole.name && oldRole.color === newRole.color && oldRole.permissions.bitfield === newRole.permissions.bitfield) return;
  const e = logEmbed('🔧 Role Updated', COLORS.warning)
    .addFields({ name: 'Role', value: `<@&${newRole.id}>`, inline: false });
  if (oldRole.name !== newRole.name) e.addFields({ name: 'Name', value: `${oldRole.name} → ${newRole.name}`, inline: false });
  if (oldRole.hexColor !== newRole.hexColor) e.addFields({ name: 'Color', value: `${oldRole.hexColor} → ${newRole.hexColor}`, inline: false });
  channel.send({ embeds: [e] }).catch(() => {});
});

// 🏠 Server updates
client.on('guildUpdate', async (oldGuild, newGuild) => {
  const channel = await getLogChannel(newGuild);
  if (!channel) return;
  const e = logEmbed('🏠 Server Updated', COLORS.warning);
  let changed = false;
  if (oldGuild.name !== newGuild.name) { e.addFields({ name: 'Name', value: `${oldGuild.name} → ${newGuild.name}`, inline: false }); changed = true; }
  if (oldGuild.iconURL() !== newGuild.iconURL()) { e.addFields({ name: 'Icon', value: 'Server icon changed', inline: false }); e.setThumbnail(newGuild.iconURL()); changed = true; }
  if (changed) channel.send({ embeds: [e] }).catch(() => {});
});

// 😀 Emoji create/update/delete
client.on('emojiCreate', async (emoji) => {
  const channel = await getLogChannel(emoji.guild);
  if (!channel) return;
  channel.send({ embeds: [logEmbed('😀 Emoji Added', COLORS.success).addFields({ name: 'Emoji', value: `${emoji.name} (${emoji.id})`, inline: false }).setThumbnail(emoji.imageURL())] }).catch(() => {});
});

client.on('emojiDelete', async (emoji) => {
  const channel = await getLogChannel(emoji.guild);
  if (!channel) return;
  channel.send({ embeds: [logEmbed('🗑️ Emoji Removed', COLORS.mod).addFields({ name: 'Emoji', value: `${emoji.name} (${emoji.id})`, inline: false })] }).catch(() => {});
});

client.on('emojiUpdate', async (oldEmoji, newEmoji) => {
  if (oldEmoji.name === newEmoji.name) return;
  const channel = await getLogChannel(newEmoji.guild);
  if (!channel) return;
  channel.send({ embeds: [logEmbed('🔧 Emoji Renamed', COLORS.warning).addFields({ name: 'Before', value: oldEmoji.name, inline: true }, { name: 'After', value: newEmoji.name, inline: true })] }).catch(() => {});
});

// ─── Event: Reactions (reaction roles) ───────────────────────────────────────
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch().catch(() => {});
  const data = await db.get(`rr_${reaction.message.id}`);
  if (!data) return;
  if (reaction.emoji.name === data.emoji || reaction.emoji.toString() === data.emoji) {
    const guild = reaction.message.guild;
    const member = guild.members.cache.get(user.id);
    const role = guild.roles.cache.get(data.roleId);
    if (member && role) member.roles.add(role).catch(() => {});
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch().catch(() => {});
  const data = await db.get(`rr_${reaction.message.id}`);
  if (!data) return;
  if (reaction.emoji.name === data.emoji || reaction.emoji.toString() === data.emoji) {
    const guild = reaction.message.guild;
    const member = guild.members.cache.get(user.id);
    const role = guild.roles.cache.get(data.roleId);
    if (member && role) member.roles.remove(role).catch(() => {});
  }
});

// ─── Ready ────────────────────────────────────────────────────────────────────
client.once('ready', () => {
  const count = Object.keys(commands).length;
  console.log(`
╔══════════════════════════════════════╗
║   ✅ ${client.user.tag} connected!        ║
║   📡 ${client.guilds.cache.size} server(s)               ║
║   📦 ${count} commands loaded            ║
║   🔤 Prefix: ${PREFIX}                       ║
╚══════════════════════════════════════╝
  `);
  client.user.setActivity(`${PREFIX}help | ${count} commands`, { type: 3 });

  // Giveaway auto-end checker
  checkGiveaways();
  setInterval(checkGiveaways, 30000);
});

// ─── Login ────────────────────────────────────────────────────────────────────
client.login(TOKEN);
