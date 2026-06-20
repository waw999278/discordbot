require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

// ─────────────────────────────────────────────
//  CLIENT SETUP
// ─────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const PREFIX = '!';

// ─────────────────────────────────────────────
//  IN-MEMORY STORES  (replace with a DB for persistence)
// ─────────────────────────────────────────────
const xpStore    = {};   // { guildId_userId: { xp, level, messages } }
const warnStore  = {};   // { guildId_userId: [ { reason, by, date } ] }
const xpCooldowns = new Set();
const activeGiveaways = new Map(); // messageId → giveaway meta

// ─────────────────────────────────────────────
//  XP HELPERS
// ─────────────────────────────────────────────
function getProfile(guildId, userId) {
  const key = `${guildId}_${userId}`;
  if (!xpStore[key]) xpStore[key] = { xp: 0, level: 0, messages: 0 };
  return xpStore[key];
}

function xpForLevel(level) {
  return 5 * level ** 2 + 50 * level + 100;
}

function xpProgressBar(current, needed, length = 20) {
  const filled = Math.min(Math.round((current / needed) * length), length);
  return '█'.repeat(filled) + '░'.repeat(length - filled);
}

// ─────────────────────────────────────────────
//  GENERAL HELPERS
// ─────────────────────────────────────────────
function parseDuration(str) {
  const match = str?.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return parseInt(match[1]) * multipliers[match[2]];
}

function humanDuration(ms) {
  if (ms < 60_000)      return `${ms / 1000}s`;
  if (ms < 3_600_000)   return `${ms / 60_000}m`;
  if (ms < 86_400_000)  return `${ms / 3_600_000}h`;
  return `${ms / 86_400_000}d`;
}

const color = {
  blue:   '#5865F2',
  gold:   '#FFD700',
  red:    '#ED4245',
  orange: '#FEA500',
  green:  '#57F287',
  grey:   '#99AAB5',
  blurple:'#7289DA',
};

function embed(c = color.blue) {
  return new EmbedBuilder().setColor(c).setTimestamp();
}

function errorEmbed(text) {
  return embed(color.red).setDescription(`❌ ${text}`);
}

function successEmbed(text) {
  return embed(color.green).setDescription(`✅ ${text}`);
}

// ─────────────────────────────────────────────
//  READY
// ─────────────────────────────────────────────
client.once('ready', () => {
  console.log(`✅ Bot online: ${client.user.tag}`);
  client.user.setActivity(`${PREFIX}help for commands`);
});

// ─────────────────────────────────────────────
//  WELCOME — guildMemberAdd
// ─────────────────────────────────────────────
client.on('guildMemberAdd', member => {
  const welcomeEmbed = embed(color.blurple)
    .setTitle(`👋 Welcome to ${member.guild.name}!`)
    .setDescription(
      `Hey ${member}, you're member **#${member.guild.memberCount}**! 🎉\n` +
      `Read the rules and enjoy your stay.`
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() });

  const ch = member.guild.systemChannel;
  if (ch) ch.send({ embeds: [welcomeEmbed] });
});

// ─────────────────────────────────────────────
//  MESSAGE HANDLER
// ─────────────────────────────────────────────
client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  // ── XP System ──────────────────────────────
  const xpKey = `${message.guild.id}_${message.author.id}`;
  if (!xpCooldowns.has(xpKey)) {
    xpCooldowns.add(xpKey);
    setTimeout(() => xpCooldowns.delete(xpKey), 60_000);

    const profile = getProfile(message.guild.id, message.author.id);
    profile.xp += Math.floor(Math.random() * 15) + 5;
    profile.messages += 1;

    const needed = xpForLevel(profile.level + 1);
    if (profile.xp >= needed) {
      profile.level += 1;
      await message.channel.send({
        embeds: [
          embed(color.gold).setDescription(
            `⬆️ ${message.author} just reached **Level ${profile.level}**! 🎉`
          ),
        ],
      });
    }
  }

  // ── Command Parsing ────────────────────────
  if (!message.content.startsWith(PREFIX)) return;
  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const cmd  = args.shift().toLowerCase();

  // ════════════════════════════════════════════
  //  INFORMATION COMMANDS
  // ════════════════════════════════════════════

  // ── !help ──────────────────────────────────
  if (cmd === 'help') {
    const target = args[0]?.toLowerCase();

    const commandHelp = {
      ban:        { usage: '!ban @user [reason]',        desc: 'Permanently ban a member.' },
      kick:       { usage: '!kick @user [reason]',       desc: 'Kick a member from the server.' },
      mute:       { usage: '!mute @user <time> [reason]',desc: 'Timeout a member (e.g. 10m, 1h).' },
      warn:       { usage: '!warn @user [reason]',       desc: 'Issue a warning to a member.' },
      warns:      { usage: '!warns [@user]',             desc: 'List warnings for a member.' },
      clearwarns: { usage: '!clearwarns @user',          desc: 'Clear all warnings for a member.' },
      purge:      { usage: '!purge <1-100>',             desc: 'Bulk-delete messages.' },
      slowmode:   { usage: '!slowmode <seconds>',        desc: 'Set channel slow-mode.' },
      lock:       { usage: '!lock [reason]',             desc: 'Lock the current channel.' },
      unlock:     { usage: '!unlock',                    desc: 'Unlock the current channel.' },
      role:       { usage: '!role @user @role',          desc: 'Add or remove a role from a member.' },
      nick:       { usage: '!nick @user <nickname>',     desc: 'Change a member\'s nickname.' },
      rank:       { usage: '!rank [@user]',              desc: 'Show XP rank card.' },
      leaderboard:{ usage: '!leaderboard',               desc: 'Show server XP leaderboard.' },
      gcreate:    { usage: '!gcreate <time> <winners> <prize>', desc: 'Start a giveaway.' },
      greroll:    { usage: '!greroll <messageId>',       desc: 'Re-roll a giveaway winner.' },
      gend:       { usage: '!gend <messageId>',          desc: 'End a giveaway early.' },
      '8ball':    { usage: '!8ball <question>',          desc: 'Ask the magic 8-ball.' },
      coinflip:   { usage: '!coinflip',                  desc: 'Flip a coin.' },
      dice:       { usage: '!dice [faces]',              desc: 'Roll a dice.' },
      poll:       { usage: '!poll "Question" "Opt1" "Opt2"', desc: 'Create a reaction poll.' },
      avatar:     { usage: '!avatar [@user]',            desc: 'Show a user\'s avatar.' },
      say:        { usage: '!say <text>',                desc: 'Make the bot say something.' },
      fight:      { usage: '!fight @user',               desc: 'Challenge someone to a fight.' },
      choose:     { usage: '!choose <opt1> <opt2> ...',  desc: 'Pick a random option.' },
      ask:        { usage: '!ask <question>',            desc: 'Ask the bot a yes/no question.' },
      rps:        { usage: '!rps <rock|paper|scissors>', desc: 'Play rock-paper-scissors.' },
      ping:       { usage: '!ping',                      desc: 'Show bot latency.' },
      userinfo:   { usage: '!userinfo [@user]',          desc: 'Show info about a user.' },
      serverinfo: { usage: '!serverinfo',                desc: 'Show info about the server.' },
      botinfo:    { usage: '!botinfo',                   desc: 'Show info about the bot.' },
      announce:   { usage: '!announce #channel <text>',  desc: 'Send an announcement embed.' },
      embed:      { usage: '!embed <text>',              desc: 'Send a custom embed message.' },
      invite:     { usage: '!invite',                    desc: 'Get the bot invite link.' },
      vote:       { usage: '!vote',                      desc: 'Vote for this bot.' },
    };

    if (target && commandHelp[target]) {
      const info = commandHelp[target];
      return message.reply({
        embeds: [
          embed(color.blue)
            .setTitle(`📖 Help — \`${PREFIX}${target}\``)
            .addFields(
              { name: 'Usage',       value: `\`${info.usage}\`` },
              { name: 'Description', value: info.desc },
            ),
        ],
      });
    }

    return message.reply({
      embeds: [
        embed(color.blue)
          .setTitle('📖 Command List')
          .setDescription(`Use \`${PREFIX}help <command>\` for detailed help.`)
          .addFields(
            { name: '📢 Information',  value: '`ping` `botinfo` `invite` `vote`' },
            { name: '🛡️ Moderation',   value: '`ban` `kick` `mute` `warn` `warns` `clearwarns` `purge` `slowmode` `lock` `unlock` `role` `nick`' },
            { name: '⭐ Levels',        value: '`rank` `leaderboard`' },
            { name: '🎉 Giveaways',    value: '`gcreate` `greroll` `gend`' },
            { name: '🎭 Fun',          value: '`8ball` `coinflip` `dice` `poll` `avatar` `say` `fight` `choose` `ask` `rps`' },
            { name: '🔧 Utility',      value: '`userinfo` `serverinfo` `announce` `embed`' },
          )
          .setFooter({ text: `Prefix: ${PREFIX}` }),
      ],
    });
  }

  // ── !ping ──────────────────────────────────
  if (cmd === 'ping') {
    const sent = await message.reply('🏓 Calculating...');
    return sent.edit({
      content: '',
      embeds: [
        embed(color.blue)
          .setTitle('🏓 Pong!')
          .addFields(
            { name: 'Roundtrip',  value: `**${sent.createdTimestamp - message.createdTimestamp}ms**`, inline: true },
            { name: 'API Latency', value: `**${Math.round(client.ws.ping)}ms**`, inline: true },
          ),
      ],
    });
  }

  // ── !botinfo ───────────────────────────────
  if (cmd === 'botinfo') {
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    return message.reply({
      embeds: [
        embed(color.blurple)
          .setTitle('🤖 Bot Info')
          .setThumbnail(client.user.displayAvatarURL())
          .addFields(
            { name: '📛 Name',      value: client.user.tag,                        inline: true },
            { name: '🆔 ID',        value: client.user.id,                         inline: true },
            { name: '📡 Servers',   value: `${client.guilds.cache.size}`,          inline: true },
            { name: '👥 Users',     value: `${client.users.cache.size}`,           inline: true },
            { name: '⏱️ Uptime',    value: `${h}h ${m}m ${s}s`,                   inline: true },
            { name: '📦 discord.js',value: require('discord.js').version,          inline: true },
          ),
      ],
    });
  }

  // ── !invite ────────────────────────────────
  if (cmd === 'invite') {
    const link = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`;
    return message.reply({
      embeds: [
        embed(color.blurple)
          .setTitle('📨 Invite Me!')
          .setDescription(`[Click here to add the bot to your server](${link})`),
      ],
    });
  }

  // ── !vote ──────────────────────────────────
  if (cmd === 'vote') {
    return message.reply({
      embeds: [
        embed(color.gold)
          .setTitle('⭐ Vote for this Bot')
          .setDescription('Support the bot by voting on Top.gg!\n[Vote here](https://top.gg)'),
      ],
    });
  }

  // ════════════════════════════════════════════
  //  MODERATION COMMANDS
  // ════════════════════════════════════════════

  // ── !ban ───────────────────────────────────
  if (cmd === 'ban') {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
      return message.reply({ embeds: [errorEmbed('You need the **Ban Members** permission.')] });

    const target = message.mentions.members.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Please mention a member to ban.')] });
    if (!target.bannable) return message.reply({ embeds: [errorEmbed('I cannot ban that member.')] });

    const reason = args.slice(1).join(' ') || 'No reason provided';
    await target.ban({ reason, deleteMessageSeconds: 604800 });

    return message.reply({
      embeds: [
        embed(color.red)
          .setTitle('🔨 Member Banned')
          .addFields(
            { name: 'User',   value: target.user.tag, inline: true },
            { name: 'Reason', value: reason,           inline: true },
            { name: 'By',     value: message.author.tag, inline: true },
          ),
      ],
    });
  }

  // ── !kick ──────────────────────────────────
  if (cmd === 'kick') {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers))
      return message.reply({ embeds: [errorEmbed('You need the **Kick Members** permission.')] });

    const target = message.mentions.members.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Please mention a member to kick.')] });
    if (!target.kickable) return message.reply({ embeds: [errorEmbed('I cannot kick that member.')] });

    const reason = args.slice(1).join(' ') || 'No reason provided';
    await target.kick(reason);

    return message.reply({
      embeds: [
        embed(color.orange)
          .setTitle('👢 Member Kicked')
          .addFields(
            { name: 'User',   value: target.user.tag, inline: true },
            { name: 'Reason', value: reason,           inline: true },
            { name: 'By',     value: message.author.tag, inline: true },
          ),
      ],
    });
  }

  // ── !mute ──────────────────────────────────
  if (cmd === 'mute') {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
      return message.reply({ embeds: [errorEmbed('You need the **Moderate Members** permission.')] });

    const target = message.mentions.members.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Please mention a member to mute.')] });

    const durStr = args[1];
    const durMs  = parseDuration(durStr);
    if (!durMs) return message.reply({ embeds: [errorEmbed('Invalid duration. Examples: `10m`, `1h`, `2d`')] });

    const reason = args.slice(2).join(' ') || 'No reason provided';
    await target.timeout(durMs, reason);

    return message.reply({
      embeds: [
        embed(color.grey)
          .setTitle('🔇 Member Muted')
          .addFields(
            { name: 'User',     value: target.user.tag,   inline: true },
            { name: 'Duration', value: humanDuration(durMs), inline: true },
            { name: 'Reason',   value: reason,             inline: true },
          ),
      ],
    });
  }

  // ── !unmute ────────────────────────────────
  if (cmd === 'unmute') {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
      return message.reply({ embeds: [errorEmbed('You need the **Moderate Members** permission.')] });

    const target = message.mentions.members.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Please mention a member to unmute.')] });

    await target.timeout(null);
    return message.reply({ embeds: [successEmbed(`**${target.user.tag}** has been unmuted.`)] });
  }

  // ── !warn ──────────────────────────────────
  if (cmd === 'warn') {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
      return message.reply({ embeds: [errorEmbed('You need the **Moderate Members** permission.')] });

    const target = message.mentions.members.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Please mention a member to warn.')] });

    const reason = args.slice(1).join(' ') || 'No reason provided';
    const key    = `${message.guild.id}_${target.id}`;
    if (!warnStore[key]) warnStore[key] = [];
    warnStore[key].push({ reason, by: message.author.tag, date: new Date().toLocaleDateString() });

    return message.reply({
      embeds: [
        embed(color.orange)
          .setTitle('⚠️ Warning Issued')
          .addFields(
            { name: 'User',     value: target.user.tag,          inline: true },
            { name: 'Reason',   value: reason,                   inline: true },
            { name: 'Total',    value: `${warnStore[key].length}`, inline: true },
          ),
      ],
    });
  }

  // ── !warns ─────────────────────────────────
  if (cmd === 'warns') {
    const target = message.mentions.members.first() || message.member;
    const key    = `${message.guild.id}_${target.id}`;
    const warns  = warnStore[key] || [];

    return message.reply({
      embeds: [
        embed(color.orange)
          .setTitle(`⚠️ Warnings — ${target.user.tag}`)
          .setDescription(
            warns.length
              ? warns.map((w, i) => `**${i + 1}.** ${w.reason} — by ${w.by} *(${w.date})*`).join('\n')
              : 'No warnings on record.'
          ),
      ],
    });
  }

  // ── !clearwarns ────────────────────────────
  if (cmd === 'clearwarns') {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
      return message.reply({ embeds: [errorEmbed('You need the **Moderate Members** permission.')] });

    const target = message.mentions.members.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Please mention a member.')] });

    const key = `${message.guild.id}_${target.id}`;
    warnStore[key] = [];
    return message.reply({ embeds: [successEmbed(`All warnings cleared for **${target.user.tag}**.`)] });
  }

  // ── !purge ─────────────────────────────────
  if (cmd === 'purge') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages))
      return message.reply({ embeds: [errorEmbed('You need the **Manage Messages** permission.')] });

    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100)
      return message.reply({ embeds: [errorEmbed('Please provide a number between **1** and **100**.')] });

    await message.delete();
    const deleted = await message.channel.bulkDelete(amount, true);
    const notice  = await message.channel.send({
      embeds: [successEmbed(`Deleted **${deleted.size}** message(s).`)],
    });
    setTimeout(() => notice.delete().catch(() => {}), 4000);
  }

  // ── !slowmode ──────────────────────────────
  if (cmd === 'slowmode') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels))
      return message.reply({ embeds: [errorEmbed('You need the **Manage Channels** permission.')] });

    const sec = parseInt(args[0]) ?? 0;
    if (isNaN(sec) || sec < 0 || sec > 21600)
      return message.reply({ embeds: [errorEmbed('Please provide a number between **0** and **21600** seconds.')] });

    await message.channel.setRateLimitPerUser(sec);
    return message.reply({
      embeds: [successEmbed(sec === 0 ? 'Slow-mode disabled.' : `Slow-mode set to **${sec}s**.`)],
    });
  }

  // ── !lock ──────────────────────────────────
  if (cmd === 'lock') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels))
      return message.reply({ embeds: [errorEmbed('You need the **Manage Channels** permission.')] });

    const reason = args.join(' ') || 'No reason provided';
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: false,
    });
    return message.reply({
      embeds: [
        embed(color.red)
          .setTitle('🔒 Channel Locked')
          .setDescription(`**${message.channel.name}** has been locked.\nReason: ${reason}`),
      ],
    });
  }

  // ── !unlock ────────────────────────────────
  if (cmd === 'unlock') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels))
      return message.reply({ embeds: [errorEmbed('You need the **Manage Channels** permission.')] });

    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: null,
    });
    return message.reply({
      embeds: [
        embed(color.green)
          .setTitle('🔓 Channel Unlocked')
          .setDescription(`**${message.channel.name}** is now open.`),
      ],
    });
  }

  // ── !role ──────────────────────────────────
  if (cmd === 'role') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles))
      return message.reply({ embeds: [errorEmbed('You need the **Manage Roles** permission.')] });

    const target = message.mentions.members.first();
    const role   = message.mentions.roles.first();
    if (!target || !role)
      return message.reply({ embeds: [errorEmbed('Usage: `!role @user @role`')] });

    if (target.roles.cache.has(role.id)) {
      await target.roles.remove(role);
      return message.reply({ embeds: [successEmbed(`Removed **${role.name}** from **${target.user.tag}**.`)] });
    } else {
      await target.roles.add(role);
      return message.reply({ embeds: [successEmbed(`Added **${role.name}** to **${target.user.tag}**.`)] });
    }
  }

  // ── !nick ──────────────────────────────────
  if (cmd === 'nick') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageNicknames))
      return message.reply({ embeds: [errorEmbed('You need the **Manage Nicknames** permission.')] });

    const target = message.mentions.members.first();
    if (!target) return message.reply({ embeds: [errorEmbed('Please mention a member.')] });

    const nick = args.slice(1).join(' ') || null;
    await target.setNickname(nick);
    return message.reply({
      embeds: [successEmbed(nick ? `Nickname set to **${nick}** for **${target.user.tag}**.` : `Nickname reset for **${target.user.tag}**.`)],
    });
  }

  // ════════════════════════════════════════════
  //  LEVEL COMMANDS
  // ════════════════════════════════════════════

  // ── !rank ──────────────────────────────────
  if (cmd === 'rank') {
    const target  = message.mentions.users.first() || message.author;
    const profile = getProfile(message.guild.id, target.id);
    const needed  = xpForLevel(profile.level + 1);
    const current = profile.xp % needed;

    return message.reply({
      embeds: [
        embed(color.gold)
          .setTitle(`📊 ${target.username}'s Rank`)
          .setThumbnail(target.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: '🏆 Level',    value: `**${profile.level}**`,    inline: true },
            { name: '⭐ XP',       value: `**${profile.xp}**`,       inline: true },
            { name: '💬 Messages', value: `**${profile.messages}**`, inline: true },
            { name: 'Progress',   value: `\`${xpProgressBar(current, needed)}\`\n${current} / ${needed} XP to next level` },
          ),
      ],
    });
  }

  // ── !leaderboard ───────────────────────────
  if (cmd === 'leaderboard' || cmd === 'lb') {
    const entries = Object.entries(xpStore)
      .filter(([k]) => k.startsWith(message.guild.id))
      .map(([k, v]) => ({ userId: k.split('_')[1], ...v }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 10);

    const medals = ['🥇', '🥈', '🥉'];
    const desc   = entries.length
      ? entries.map((e, i) => `${medals[i] ?? `**${i + 1}.**`} <@${e.userId}> — **${e.xp} XP** (Lv.${e.level})`).join('\n')
      : 'No data yet — start chatting!';

    return message.reply({
      embeds: [embed(color.gold).setTitle('🏆 Server Leaderboard').setDescription(desc)],
    });
  }

  // ════════════════════════════════════════════
  //  GIVEAWAY COMMANDS
  // ════════════════════════════════════════════

  // ── !gcreate ───────────────────────────────
  if (cmd === 'gcreate') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ embeds: [errorEmbed('You need the **Manage Server** permission.')] });

    if (args.length < 3)
      return message.reply({ embeds: [errorEmbed('Usage: `!gcreate <time> <winners> <prize>`\nExample: `!gcreate 1h 2 Nitro Classic`')] });

    const durMs = parseDuration(args[0]);
    if (!durMs) return message.reply({ embeds: [errorEmbed('Invalid duration. Examples: `30m`, `2h`, `1d`')] });

    const winners = parseInt(args[1]);
    if (isNaN(winners) || winners < 1)
      return message.reply({ embeds: [errorEmbed('Winners must be a number ≥ 1.')] });

    const prize   = args.slice(2).join(' ');
    const endTime = Math.floor((Date.now() + durMs) / 1000);

    const gMsg = await message.channel.send({
      embeds: [
        embed(color.gold)
          .setTitle('🎉 GIVEAWAY 🎉')
          .setDescription(
            `**Prize:** ${prize}\n\n` +
            `React with 🎉 to enter!\n` +
            `⏰ Ends: <t:${endTime}:R>\n` +
            `🏆 Winners: **${winners}**\n` +
            `👤 Hosted by: ${message.author}`
          ),
      ],
    });

    await gMsg.react('🎉');
    message.delete().catch(() => {});

    activeGiveaways.set(gMsg.id, { channelId: message.channel.id, prize, winners });

    setTimeout(async () => {
      await endGiveaway(gMsg, prize, winners, message.channel);
    }, durMs);
  }

  // ── !greroll ───────────────────────────────
  if (cmd === 'greroll') {
    const msgId = args[0];
    if (!msgId) return message.reply({ embeds: [errorEmbed('Usage: `!greroll <messageId>`')] });

    try {
      const gMsg    = await message.channel.messages.fetch(msgId);
      const meta    = activeGiveaways.get(msgId);
      const prize   = meta?.prize   ?? 'Unknown prize';
      const winners = meta?.winners ?? 1;
      await endGiveaway(gMsg, prize, winners, message.channel);
    } catch {
      return message.reply({ embeds: [errorEmbed('Could not find that giveaway message in this channel.')] });
    }
  }

  // ── !gend ──────────────────────────────────
  if (cmd === 'gend') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ embeds: [errorEmbed('You need the **Manage Server** permission.')] });

    const msgId = args[0];
    if (!msgId) return message.reply({ embeds: [errorEmbed('Usage: `!gend <messageId>`')] });

    try {
      const gMsg  = await message.channel.messages.fetch(msgId);
      const meta  = activeGiveaways.get(msgId);
      await endGiveaway(gMsg, meta?.prize ?? 'Unknown', meta?.winners ?? 1, message.channel);
    } catch {
      return message.reply({ embeds: [errorEmbed('Could not find that giveaway message.')] });
    }
  }

  // ════════════════════════════════════════════
  //  FUN COMMANDS
  // ════════════════════════════════════════════

  // ── !8ball ─────────────────────────────────
  if (cmd === '8ball') {
    if (!args.length) return message.reply({ embeds: [errorEmbed('Ask me a question!')] });
    const responses = [
      '✅ It is certain.',
      '✅ Without a doubt.',
      '✅ Yes, definitely!',
      '✅ As I see it, yes.',
      '🟡 Reply hazy, try again.',
      '🟡 Ask again later.',
      '🟡 Cannot predict now.',
      '❌ Don\'t count on it.',
      '❌ Very doubtful.',
      '❌ My sources say no.',
    ];
    const answer = responses[Math.floor(Math.random() * responses.length)];
    return message.reply({
      embeds: [
        embed(color.blurple)
          .setTitle('🎱 Magic 8-Ball')
          .addFields(
            { name: 'Question', value: args.join(' ') },
            { name: 'Answer',   value: answer },
          ),
      ],
    });
  }

  // ── !ask ───────────────────────────────────
  if (cmd === 'ask') {
    if (!args.length) return message.reply({ embeds: [errorEmbed('Ask me a question!')] });
    const answers = ['Yes!', 'No.', 'Definitely yes!', 'Absolutely not.', 'Maybe...', 'I\'m not sure.', 'Of course!', 'Never.'];
    return message.reply({
      embeds: [
        embed(color.blurple)
          .setTitle('🤔 Question')
          .addFields(
            { name: 'Question', value: args.join(' ') },
            { name: 'Answer',   value: answers[Math.floor(Math.random() * answers.length)] },
          ),
      ],
    });
  }

  // ── !coinflip ──────────────────────────────
  if (cmd === 'coinflip') {
    const result = Math.random() < 0.5 ? '🪙 Heads!' : '🪙 Tails!';
    return message.reply({ embeds: [embed(color.gold).setDescription(result)] });
  }

  // ── !dice ──────────────────────────────────
  if (cmd === 'dice') {
    const faces  = parseInt(args[0]) || 6;
    const result = Math.floor(Math.random() * faces) + 1;
    return message.reply({
      embeds: [
        embed(color.blurple)
          .setDescription(`🎲 You rolled a **${result}** on a **${faces}**-sided die!`),
      ],
    });
  }

  // ── !choose ────────────────────────────────
  if (cmd === 'choose') {
    if (args.length < 2)
      return message.reply({ embeds: [errorEmbed('Provide at least 2 options. Usage: `!choose opt1 opt2 opt3`')] });
    const chosen = args[Math.floor(Math.random() * args.length)];
    return message.reply({
      embeds: [
        embed(color.blurple)
          .setTitle('🎯 I choose...')
          .setDescription(`**${chosen}**\n\n*Out of: ${args.join(', ')}*`),
      ],
    });
  }

  // ── !fight ─────────────────────────────────
  if (cmd === 'fight') {
    const opponent = message.mentions.users.first();
    if (!opponent) return message.reply({ embeds: [errorEmbed('Mention someone to fight!')] });
    if (opponent.id === message.author.id)
      return message.reply({ embeds: [errorEmbed('You cannot fight yourself!')] });

    const winner = Math.random() < 0.5 ? message.author : opponent;
    const loser  = winner.id === message.author.id ? opponent : message.author;

    return message.reply({
      embeds: [
        embed(color.red)
          .setTitle('⚔️ Fight!')
          .setDescription(
            `${message.author} challenges ${opponent} to a fight!\n\n` +
            `After an intense battle... **${winner.username}** wins! 🏆\n` +
            `${loser.username} has been defeated. 💀`
          ),
      ],
    });
  }

  // ── !rps ───────────────────────────────────
  if (cmd === 'rps') {
    const choices = ['rock', 'paper', 'scissors'];
    const userChoice = args[0]?.toLowerCase();
    if (!choices.includes(userChoice))
      return message.reply({ embeds: [errorEmbed('Choose `rock`, `paper`, or `scissors`.')] });

    const botChoice = choices[Math.floor(Math.random() * choices.length)];
    const icons     = { rock: '🪨', paper: '📄', scissors: '✂️' };
    let result;
    if (userChoice === botChoice) result = "It's a **tie**!";
    else if (
      (userChoice === 'rock'     && botChoice === 'scissors') ||
      (userChoice === 'paper'    && botChoice === 'rock')     ||
      (userChoice === 'scissors' && botChoice === 'paper')
    ) result = '🎉 You **win**!';
    else result = '😢 You **lose**!';

    return message.reply({
      embeds: [
        embed(color.blurple)
          .setTitle('🎮 Rock · Paper · Scissors')
          .addFields(
            { name: 'Your choice', value: `${icons[userChoice]} ${userChoice}`, inline: true },
            { name: 'My choice',   value: `${icons[botChoice]} ${botChoice}`,   inline: true },
            { name: 'Result',      value: result },
          ),
      ],
    });
  }

  // ── !say ───────────────────────────────────
  if (cmd === 'say') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages))
      return message.reply({ embeds: [errorEmbed('You need the **Manage Messages** permission.')] });
    if (!args.length) return message.reply({ embeds: [errorEmbed('Usage: `!say <text>`')] });

    await message.delete().catch(() => {});
    return message.channel.send(args.join(' '));
  }

  // ── !poll ──────────────────────────────────
  if (cmd === 'poll') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages))
      return message.reply({ embeds: [errorEmbed('You need the **Manage Messages** permission.')] });

    const parts = message.content.match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, ''));
    if (!parts || parts.length < 3)
      return message.reply({ embeds: [errorEmbed('Usage: `!poll "Question" "Option 1" "Option 2" ...`')] });

    const [question, ...options] = parts;
    if (options.length > 5)
      return message.reply({ embeds: [errorEmbed('Maximum 5 options per poll.')] });

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
    const pollMsg = await message.channel.send({
      embeds: [
        embed(color.blue)
          .setTitle(`📊 ${question}`)
          .setDescription(options.map((o, i) => `${emojis[i]} **${o}**`).join('\n'))
          .setFooter({ text: `Poll by ${message.author.tag}` }),
      ],
    });

    for (let i = 0; i < options.length; i++) await pollMsg.react(emojis[i]);
    message.delete().catch(() => {});
  }

  // ── !avatar ────────────────────────────────
  if (cmd === 'avatar') {
    const target = message.mentions.users.first() || message.author;
    return message.reply({
      embeds: [
        embed(color.blue)
          .setTitle(`🖼️ ${target.username}'s Avatar`)
          .setImage(target.displayAvatarURL({ dynamic: true, size: 1024 }))
          .setURL(target.displayAvatarURL({ dynamic: true, size: 4096 })),
      ],
    });
  }

  // ════════════════════════════════════════════
  //  UTILITY COMMANDS
  // ════════════════════════════════════════════

  // ── !embed ─────────────────────────────────
  if (cmd === 'embed') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages))
      return message.reply({ embeds: [errorEmbed('You need the **Manage Messages** permission.')] });
    if (!args.length) return message.reply({ embeds: [errorEmbed('Usage: `!embed <text>`')] });

    await message.delete().catch(() => {});
    return message.channel.send({
      embeds: [embed(color.blue).setDescription(args.join(' '))],
    });
  }

  // ── !userinfo ──────────────────────────────
  if (cmd === 'userinfo') {
    const target = message.mentions.members.first() || message.member;
    const roles  = target.roles.cache
      .filter(r => r.id !== message.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(r => r.toString())
      .slice(0, 10)
      .join(' ') || 'None';

    return message.reply({
      embeds: [
        embed(color.blue)
          .setTitle(`👤 ${target.user.tag}`)
          .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: '🆔 ID',           value: target.id,                                                        inline: true },
            { name: '🤖 Bot',          value: target.user.bot ? 'Yes' : 'No',                                   inline: true },
            { name: '📅 Joined Discord',value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`,      inline: true },
            { name: '📥 Joined Server', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`,            inline: true },
            { name: '🎭 Roles',         value: roles },
          ),
      ],
    });
  }

  // ── !serverinfo ────────────────────────────
  if (cmd === 'serverinfo') {
    const g = message.guild;
    return message.reply({
      embeds: [
        embed(color.blue)
          .setTitle(`🏠 ${g.name}`)
          .setThumbnail(g.iconURL({ dynamic: true }))
          .addFields(
            { name: '🆔 ID',         value: g.id,                           inline: true },
            { name: '👤 Owner',      value: `<@${g.ownerId}>`,              inline: true },
            { name: '👥 Members',    value: `${g.memberCount}`,             inline: true },
            { name: '💬 Channels',   value: `${g.channels.cache.size}`,     inline: true },
            { name: '🎭 Roles',      value: `${g.roles.cache.size}`,        inline: true },
            { name: '😀 Emojis',     value: `${g.emojis.cache.size}`,       inline: true },
            { name: '📅 Created',    value: `<t:${Math.floor(g.createdTimestamp / 1000)}:R>`, inline: true },
            { name: '🔒 Verification', value: g.verificationLevel.toString(), inline: true },
            { name: '💎 Boosts',     value: `${g.premiumSubscriptionCount}`, inline: true },
          ),
      ],
    });
  }

  // ── !announce ──────────────────────────────
  if (cmd === 'announce') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ embeds: [errorEmbed('You need the **Manage Server** permission.')] });

    const channel = message.mentions.channels.first();
    if (!channel) return message.reply({ embeds: [errorEmbed('Mention a channel. Usage: `!announce #channel <text>`')] });

    const text = args.slice(1).join(' ');
    if (!text) return message.reply({ embeds: [errorEmbed('Provide a message to announce.')] });

    await channel.send({
      embeds: [
        embed(color.blurple)
          .setTitle('📢 Announcement')
          .setDescription(text)
          .setFooter({ text: `Announced by ${message.author.tag}` }),
      ],
    });
    return message.reply({ embeds: [successEmbed(`Announcement sent in ${channel}!`)] });
  }
});

// ─────────────────────────────────────────────
//  GIVEAWAY HELPER
// ─────────────────────────────────────────────
async function endGiveaway(gMsg, prize, winnersCount, channel) {
  const reaction = gMsg.reactions.cache.get('🎉');
  if (!reaction) return channel.send({ embeds: [errorEmbed('No reactions found on that message.')] });

  const users    = await reaction.users.fetch();
  const entries  = users.filter(u => !u.bot).map(u => u);

  if (!entries.length) {
    return channel.send({ embeds: [new EmbedBuilder().setColor(color.red).setDescription('🎉 No valid entries — no winner was drawn.')] });
  }

  const shuffled    = entries.sort(() => Math.random() - 0.5);
  const winnersList = shuffled.slice(0, winnersCount);

  await channel.send({
    embeds: [
      embed(color.gold)
        .setTitle('🎉 Giveaway Ended!')
        .setDescription(
          `**Prize:** ${prize}\n` +
          `**Winner(s):** ${winnersList.join(', ')}\n\n` +
          `Congratulations! 🎊`
        ),
    ],
  });
}

// ─────────────────────────────────────────────
//  ERROR HANDLERS
// ─────────────────────────────────────────────
client.on('error', err => console.error('Client error:', err));
process.on('unhandledRejection', err => console.error('Unhandled rejection:', err));

// ─────────────────────────────────────────────
//  LOGIN
// ─────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN);
