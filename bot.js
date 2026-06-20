/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║          BOT DISCORD MULTIFONCTION — PREFIX: !               ║
 * ║   100+ commandes : Modération, Niveaux, Fun, Utilitaires     ║
 * ║   Inspiré de : Saphire • Dyno • Arcane • Circle             ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

require('dotenv').config();

const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuickDB } = require('quick.db');
const ms = require('ms');

// ─── Config ───────────────────────────────────────────────────────────────────
const PREFIX = '!';
const TOKEN = process.env.TOKEN;       // Variable Railway ou fichier .env
const OWNER_ID = process.env.OWNER_ID; // Variable Railway ou fichier .env

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
  ],
});

client.commands = new Collection();
const cooldowns = new Collection();

// ─── Couleurs & Helpers ───────────────────────────────────────────────────────
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
  return embed('❌ Erreur', desc, COLORS.error);
}

function successEmbed(desc) {
  return embed('✅ Succès', desc, COLORS.success);
}

function parseDuration(str) {
  try { return ms(str); } catch { return null; }
}

function formatDuration(ms_val) {
  const s = Math.floor(ms_val / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}j ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

// ─── XP System ────────────────────────────────────────────────────────────────
async function addXP(member, amount) {
  const key = `xp_${member.guild.id}_${member.id}`;
  const current = (await db.get(key)) || { xp: 0, level: 0 };
  current.xp += amount;
  const xpNeeded = current.level * 100 + 100;
  let leveledUp = false;
  if (current.xp >= xpNeeded) {
    current.xp -= xpNeeded;
    current.level++;
    leveledUp = true;
  }
  await db.set(key, current);
  return { ...current, leveledUp };
}

async function getXP(userId, guildId) {
  return (await db.get(`xp_${guildId}_${userId}`)) || { xp: 0, level: 0 };
}

// ─── Commandes ────────────────────────────────────────────────────────────────
const commands = {

  // ══════════════ ℹ️ AIDE & INFO ══════════════
  help: {
    category: 'Info',
    description: 'Affiche toutes les commandes',
    usage: '!help [commande]',
    async execute(message, args) {
      if (args[0]) {
        const cmd = commands[args[0].toLowerCase()];
        if (!cmd) return message.reply({ embeds: [errorEmbed(`Commande \`${args[0]}\` introuvable.`)] });
        return message.reply({
          embeds: [embed(`📖 ${args[0]}`, `**Description:** ${cmd.description}\n**Usage:** \`${cmd.usage || `!${args[0]}`}\`\n**Catégorie:** ${cmd.category || 'Général'}`, COLORS.info)]
        });
      }
      const cats = {};
      for (const [name, cmd] of Object.entries(commands)) {
        const cat = cmd.category || 'Autre';
        if (!cats[cat]) cats[cat] = [];
        cats[cat].push(`\`!${name}\``);
      }
      const e = new EmbedBuilder()
        .setTitle('📚 Aide — Toutes les commandes')
        .setColor(COLORS.primary)
        .setFooter({ text: `Prefix: ${PREFIX} • ${Object.keys(commands).length} commandes` })
        .setTimestamp();
      for (const [cat, cmds] of Object.entries(cats)) {
        e.addFields({ name: cat, value: cmds.join(', '), inline: false });
      }
      message.reply({ embeds: [e] });
    }
  },

  botinfo: {
    category: 'Info',
    description: 'Informations sur le bot',
    async execute(message) {
      const e = new EmbedBuilder()
        .setTitle('🤖 Informations du Bot')
        .setColor(COLORS.primary)
        .addFields(
          { name: '📡 Ping', value: `${client.ws.ping}ms`, inline: true },
          { name: '⏱ Uptime', value: formatDuration(client.uptime), inline: true },
          { name: '🖥 Serveurs', value: `${client.guilds.cache.size}`, inline: true },
          { name: '👥 Membres', value: `${client.users.cache.size}`, inline: true },
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
    description: 'Infos sur le serveur',
    async execute(message) {
      const g = message.guild;
      const e = new EmbedBuilder()
        .setTitle(`🏠 ${g.name}`)
        .setColor(COLORS.primary)
        .setThumbnail(g.iconURL())
        .addFields(
          { name: '👑 Propriétaire', value: `<@${g.ownerId}>`, inline: true },
          { name: '👥 Membres', value: `${g.memberCount}`, inline: true },
          { name: '📅 Créé le', value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>`, inline: true },
          { name: '💬 Salons', value: `${g.channels.cache.size}`, inline: true },
          { name: '🎭 Rôles', value: `${g.roles.cache.size}`, inline: true },
          { name: '😀 Emojis', value: `${g.emojis.cache.size}`, inline: true },
          { name: '🔒 Vérification', value: g.verificationLevel.toString(), inline: true },
          { name: '💎 Boosts', value: `${g.premiumSubscriptionCount || 0} (Tier ${g.premiumTier})`, inline: true },
        )
        .setTimestamp();
      message.reply({ embeds: [e] });
    }
  },

  userinfo: {
    category: 'Info',
    description: 'Infos sur un utilisateur',
    usage: '!userinfo [@membre]',
    async execute(message, args) {
      const member = message.mentions.members.first() || message.member;
      const u = member.user;
      const e = new EmbedBuilder()
        .setTitle(`👤 ${u.tag}`)
        .setColor(member.displayHexColor || COLORS.primary)
        .setThumbnail(u.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '🆔 ID', value: u.id, inline: true },
          { name: '📅 Compte créé', value: `<t:${Math.floor(u.createdTimestamp / 1000)}:D>`, inline: true },
          { name: '📥 A rejoint le', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`, inline: true },
          { name: '🎭 Rôles', value: member.roles.cache.filter(r => r.id !== message.guild.id).map(r => `<@&${r.id}>`).join(', ') || 'Aucun', inline: false },
          { name: '🤖 Bot', value: u.bot ? 'Oui' : 'Non', inline: true },
          { name: '💎 Pseudo', value: member.displayName, inline: true },
        )
        .setTimestamp();
      message.reply({ embeds: [e] });
    }
  },

  avatar: {
    category: 'Info',
    description: 'Affiche l\'avatar d\'un membre',
    usage: '!avatar [@membre]',
    async execute(message, args) {
      const user = message.mentions.users.first() || message.author;
      const e = new EmbedBuilder()
        .setTitle(`🖼 Avatar de ${user.username}`)
        .setImage(user.displayAvatarURL({ dynamic: true, size: 512 }))
        .setColor(COLORS.primary);
      message.reply({ embeds: [e] });
    }
  },

  ping: {
    category: 'Info',
    description: 'Latence du bot',
    async execute(message) {
      const m = await message.reply('🏓 Calcul...');
      m.edit({ content: `🏓 Pong! \`${client.ws.ping}ms\` WebSocket — \`${m.createdTimestamp - message.createdTimestamp}ms\` API` });
    }
  },

  invite: {
    category: 'Info',
    description: 'Lien d\'invitation du bot',
    async execute(message) {
      const link = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`;
      message.reply({ embeds: [embed('📩 Inviter le bot', `[Clique ici pour m'inviter](${link})`, COLORS.info)] });
    }
  },

  // ══════════════ 🔨 MODÉRATION ══════════════
  ban: {
    category: 'Modération',
    description: 'Bannir un membre',
    usage: '!ban @membre [raison]',
    permissions: ['BanMembers'],
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const member = message.mentions.members.first();
      if (!member) return message.reply({ embeds: [errorEmbed('Mentionnez un membre.')] });
      const raison = args.slice(1).join(' ') || 'Aucune raison';
      await member.ban({ reason: raison, deleteMessageDays: 1 });
      message.reply({ embeds: [embed('🔨 Banni', `**${member.user.tag}** a été banni.\n📝 Raison: ${raison}`, COLORS.mod)] });
    }
  },

  kick: {
    category: 'Modération',
    description: 'Expulser un membre',
    usage: '!kick @membre [raison]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const member = message.mentions.members.first();
      if (!member) return message.reply({ embeds: [errorEmbed('Mentionnez un membre.')] });
      const raison = args.slice(1).join(' ') || 'Aucune raison';
      await member.kick(raison);
      message.reply({ embeds: [embed('👢 Expulsé', `**${member.user.tag}** a été expulsé.\n📝 Raison: ${raison}`, COLORS.mod)] });
    }
  },

  mute: {
    category: 'Modération',
    description: 'Rendre muet un membre (timeout)',
    usage: '!mute @membre [durée] [raison]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const member = message.mentions.members.first();
      if (!member) return message.reply({ embeds: [errorEmbed('Mentionnez un membre.')] });
      const duration = parseDuration(args[1]) || ms('10m');
      const raison = args.slice(2).join(' ') || 'Aucune raison';
      await member.timeout(duration, raison);
      message.reply({ embeds: [embed('🔇 Muté', `**${member.user.tag}** a été muté pendant **${formatDuration(duration)}**.\n📝 Raison: ${raison}`, COLORS.mod)] });
    }
  },

  unmute: {
    category: 'Modération',
    description: 'Retirer le mute d\'un membre',
    usage: '!unmute @membre',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const member = message.mentions.members.first();
      if (!member) return message.reply({ embeds: [errorEmbed('Mentionnez un membre.')] });
      await member.timeout(null);
      message.reply({ embeds: [successEmbed(`**${member.user.tag}** n'est plus muté.`)] });
    }
  },

  warn: {
    category: 'Modération',
    description: 'Avertir un membre',
    usage: '!warn @membre [raison]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const member = message.mentions.members.first();
      if (!member) return message.reply({ embeds: [errorEmbed('Mentionnez un membre.')] });
      const raison = args.slice(1).join(' ') || 'Aucune raison';
      const key = `warns_${message.guild.id}_${member.id}`;
      const warns = (await db.get(key)) || [];
      warns.push({ raison, date: Date.now(), par: message.author.id });
      await db.set(key, warns);
      message.reply({ embeds: [embed('⚠️ Avertissement', `**${member.user.tag}** a reçu un avertissement.\n📝 Raison: ${raison}\n📊 Total: **${warns.length}** warn(s)`, COLORS.warning)] });
    }
  },

  warns: {
    category: 'Modération',
    description: 'Voir les avertissements d\'un membre',
    usage: '!warns @membre',
    async execute(message, args) {
      const member = message.mentions.members.first() || message.member;
      const warns = (await db.get(`warns_${message.guild.id}_${member.id}`)) || [];
      if (!warns.length) return message.reply({ embeds: [successEmbed(`**${member.user.tag}** n'a aucun avertissement.`)] });
      const list = warns.map((w, i) => `**${i+1}.** ${w.raison} — <t:${Math.floor(w.date/1000)}:R>`).join('\n');
      message.reply({ embeds: [embed(`⚠️ Warns de ${member.user.tag}`, list, COLORS.warning)] });
    }
  },

  clearwarns: {
    category: 'Modération',
    description: 'Effacer les warns d\'un membre',
    usage: '!clearwarns @membre',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const member = message.mentions.members.first();
      if (!member) return message.reply({ embeds: [errorEmbed('Mentionnez un membre.')] });
      await db.delete(`warns_${message.guild.id}_${member.id}`);
      message.reply({ embeds: [successEmbed(`Les warns de **${member.user.tag}** ont été effacés.`)] });
    }
  },

  purge: {
    category: 'Modération',
    description: 'Supprimer des messages en masse',
    usage: '!purge [nombre] [@membre]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const amount = parseInt(args[0]);
      if (isNaN(amount) || amount < 1 || amount > 100) return message.reply({ embeds: [errorEmbed('Nombre entre 1 et 100.')] });
      const target = message.mentions.users.first();
      let messages = await message.channel.messages.fetch({ limit: 100 });
      if (target) messages = messages.filter(m => m.author.id === target.id);
      const toDelete = [...messages.values()].slice(0, amount);
      await message.channel.bulkDelete(toDelete, true);
      const m = await message.channel.send({ embeds: [successEmbed(`**${toDelete.length}** messages supprimés.`)] });
      setTimeout(() => m.delete().catch(() => {}), 3000);
    }
  },

  slowmode: {
    category: 'Modération',
    description: 'Activer le mode lent sur un salon',
    usage: '!slowmode [secondes]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const seconds = parseInt(args[0]) || 0;
      await message.channel.setRateLimitPerUser(seconds);
      message.reply({ embeds: [successEmbed(seconds === 0 ? 'Mode lent désactivé.' : `Mode lent réglé à **${seconds}s**.`)] });
    }
  },

  lock: {
    category: 'Modération',
    description: 'Verrouiller un salon',
    async execute(message) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
      message.reply({ embeds: [embed('🔒 Salon verrouillé', 'Personne ne peut plus envoyer de messages.', COLORS.mod)] });
    }
  },

  unlock: {
    category: 'Modération',
    description: 'Déverrouiller un salon',
    async execute(message) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });
      message.reply({ embeds: [embed('🔓 Salon déverrouillé', 'Les membres peuvent à nouveau envoyer des messages.', COLORS.success)] });
    }
  },

  addrole: {
    category: 'Modération',
    description: 'Ajouter un rôle à un membre',
    usage: '!addrole @membre @rôle',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const member = message.mentions.members.first();
      const role = message.mentions.roles.first();
      if (!member || !role) return message.reply({ embeds: [errorEmbed('Mentionnez un membre et un rôle.')] });
      await member.roles.add(role);
      message.reply({ embeds: [successEmbed(`Rôle **${role.name}** ajouté à **${member.user.tag}**.`)] });
    }
  },

  removerole: {
    category: 'Modération',
    description: 'Retirer un rôle à un membre',
    usage: '!removerole @membre @rôle',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const member = message.mentions.members.first();
      const role = message.mentions.roles.first();
      if (!member || !role) return message.reply({ embeds: [errorEmbed('Mentionnez un membre et un rôle.')] });
      await member.roles.remove(role);
      message.reply({ embeds: [successEmbed(`Rôle **${role.name}** retiré de **${member.user.tag}**.`)] });
    }
  },

  nickname: {
    category: 'Modération',
    description: 'Changer le pseudo d\'un membre',
    usage: '!nickname @membre [pseudo]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageNicknames)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const member = message.mentions.members.first();
      if (!member) return message.reply({ embeds: [errorEmbed('Mentionnez un membre.')] });
      const nick = args.slice(1).join(' ') || null;
      await member.setNickname(nick);
      message.reply({ embeds: [successEmbed(`Pseudo de **${member.user.tag}** changé en **${nick || 'réinitialisé'}**.`)] });
    }
  },

  unban: {
    category: 'Modération',
    description: 'Débannir un utilisateur',
    usage: '!unban [ID]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      if (!args[0]) return message.reply({ embeds: [errorEmbed('Fournissez un ID utilisateur.')] });
      try {
        await message.guild.members.unban(args[0]);
        message.reply({ embeds: [successEmbed(`Utilisateur \`${args[0]}\` débanni.`)] });
      } catch {
        message.reply({ embeds: [errorEmbed('Impossible de débannir cet utilisateur.')] });
      }
    }
  },

  banlist: {
    category: 'Modération',
    description: 'Liste des bannis',
    async execute(message) {
      if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const bans = await message.guild.bans.fetch();
      if (!bans.size) return message.reply({ embeds: [embed('📋 Bannis', 'Aucun banni.', COLORS.info)] });
      const list = bans.map(b => `\`${b.user.tag}\` — ${b.reason || 'Aucune raison'}`).slice(0, 20).join('\n');
      message.reply({ embeds: [embed(`📋 Bannis (${bans.size})`, list, COLORS.mod)] });
    }
  },

  // ══════════════ 📊 XP & NIVEAUX (Arcane) ══════════════
  rank: {
    category: 'Niveaux',
    description: 'Voir votre niveau et XP',
    usage: '!rank [@membre]',
    async execute(message, args) {
      const user = message.mentions.users.first() || message.author;
      const data = await getXP(user.id, message.guild.id);
      const xpNeeded = data.level * 100 + 100;
      const bar = '█'.repeat(Math.floor((data.xp / xpNeeded) * 10)) + '░'.repeat(10 - Math.floor((data.xp / xpNeeded) * 10));
      const e = new EmbedBuilder()
        .setTitle(`⭐ Rang de ${user.username}`)
        .setColor(COLORS.xp)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: '🏆 Niveau', value: `${data.level}`, inline: true },
          { name: '✨ XP', value: `${data.xp} / ${xpNeeded}`, inline: true },
          { name: '📊 Barre', value: `[${bar}]`, inline: false },
        )
        .setTimestamp();
      message.reply({ embeds: [e] });
    }
  },

  leaderboard: {
    category: 'Niveaux',
    description: 'Classement XP du serveur',
    async execute(message) {
      const allData = await db.all();
      const guildData = allData
        .filter(e => e.id.startsWith(`xp_${message.guild.id}_`))
        .map(e => ({ userId: e.id.split('_')[2], ...e.value }))
        .sort((a, b) => b.level - a.level || b.xp - a.xp)
        .slice(0, 10);
      if (!guildData.length) return message.reply({ embeds: [embed('🏆 Classement', 'Aucune donnée.', COLORS.xp)] });
      const medals = ['🥇', '🥈', '🥉'];
      const list = guildData.map((d, i) => {
        const user = client.users.cache.get(d.userId);
        return `${medals[i] || `**${i+1}.**`} ${user ? user.tag : `<@${d.userId}>`} — Niv. **${d.level}** (${d.xp} XP)`;
      }).join('\n');
      message.reply({ embeds: [embed('🏆 Classement XP', list, COLORS.xp)] });
    }
  },

  setxp: {
    category: 'Niveaux',
    description: 'Définir l\'XP d\'un membre (Admin)',
    usage: '!setxp @membre [xp]',
    async execute(message, args) {
      if (message.author.id !== OWNER_ID && !message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const member = message.mentions.members.first();
      const xp = parseInt(args[1]);
      if (!member || isNaN(xp)) return message.reply({ embeds: [errorEmbed('Usage: !setxp @membre [xp]')] });
      const key = `xp_${message.guild.id}_${member.id}`;
      const data = (await db.get(key)) || { xp: 0, level: 0 };
      data.xp = xp;
      await db.set(key, data);
      message.reply({ embeds: [successEmbed(`XP de **${member.user.tag}** réglé à **${xp}**.`)] });
    }
  },

  givexp: {
    category: 'Niveaux',
    description: 'Donner de l\'XP à un membre (Admin)',
    usage: '!givexp @membre [montant]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const member = message.mentions.members.first();
      const amount = parseInt(args[1]);
      if (!member || isNaN(amount)) return message.reply({ embeds: [errorEmbed('Usage: !givexp @membre [montant]')] });
      const result = await addXP(member, amount);
      message.reply({ embeds: [successEmbed(`**${amount}** XP donnés à **${member.user.tag}**. Niveau: **${result.level}**`)] });
    }
  },

  // ══════════════ 🎉 FUN ══════════════
  '8ball': {
    category: 'Fun',
    description: 'Posez une question à la boule magique',
    usage: '!8ball [question]',
    async execute(message, args) {
      const reponses = [
        '✅ Absolument !', '✅ Certainement oui.', '✅ Sans aucun doute.',
        '✅ Tout à fait.', '✅ Comme tu peux t\'y fier.',
        '❓ Difficile à dire.', '❓ Réessaie plus tard.', '❓ Je ne peux pas prédire cela.',
        '❌ N\'y compte pas.', '❌ Ma réponse est non.', '❌ Mes sources disent non.', '❌ Très douteux.'
      ];
      const rep = reponses[Math.floor(Math.random() * reponses.length)];
      message.reply({ embeds: [embed('🎱 Boule Magique', `**Question:** ${args.join(' ') || '???'}\n**Réponse:** ${rep}`, COLORS.primary)] });
    }
  },

  dice: {
    category: 'Fun',
    description: 'Lancer un dé',
    usage: '!dice [faces]',
    async execute(message, args) {
      const faces = parseInt(args[0]) || 6;
      if (faces < 2 || faces > 1000) return message.reply({ embeds: [errorEmbed('Nombre de faces entre 2 et 1000.')] });
      const result = Math.floor(Math.random() * faces) + 1;
      message.reply({ embeds: [embed('🎲 Dé', `Vous avez lancé un d**${faces}** et obtenez : **${result}**`, COLORS.primary)] });
    }
  },

  coinflip: {
    category: 'Fun',
    description: 'Pile ou face',
    async execute(message) {
      const result = Math.random() < 0.5 ? '🪙 Pile' : '🪙 Face';
      message.reply({ embeds: [embed('🪙 Pile ou Face', `Résultat : **${result}**`, COLORS.primary)] });
    }
  },

  rps: {
    category: 'Fun',
    description: 'Pierre, Feuille, Ciseaux',
    usage: '!rps [pierre/feuille/ciseaux]',
    async execute(message, args) {
      const choices = ['pierre', 'feuille', 'ciseaux'];
      const emojis = { pierre: '🪨', feuille: '📄', ciseaux: '✂️' };
      const choice = args[0]?.toLowerCase();
      if (!choices.includes(choice)) return message.reply({ embeds: [errorEmbed('Choisissez: pierre, feuille ou ciseaux.')] });
      const bot = choices[Math.floor(Math.random() * 3)];
      let result = '🤝 Égalité !';
      if ((choice === 'pierre' && bot === 'ciseaux') || (choice === 'feuille' && bot === 'pierre') || (choice === 'ciseaux' && bot === 'feuille'))
        result = '🏆 Vous gagnez !';
      else if (choice !== bot)
        result = '😔 Vous perdez !';
      message.reply({ embeds: [embed('🎮 Pierre Feuille Ciseaux', `Vous: ${emojis[choice]} vs Moi: ${emojis[bot]}\n\n**${result}**`, COLORS.primary)] });
    }
  },

  joke: {
    category: 'Fun',
    description: 'Blague aléatoire',
    async execute(message) {
      const jokes = [
        ['Pourquoi les plongeurs plongent-ils toujours en arrière et jamais en avant ?', 'Parce que sinon ils tomberaient dans le bateau !'],
        ['Qu\'est-ce qu\'un canif ?', 'Un petit fien.'],
        ['Comment appelle-t-on un chat tombé dans un pot de peinture ?', 'Un chat-peint.'],
        ['Pourquoi les toilettes sont toujours blanches ?', 'Pour que le proprio se sente comme un roi.'],
        ['Qu\'est-ce qu\'un crocodile qui surveille les autres crocodiles ?', 'Un croco-dile.'],
      ];
      const [setup, punchline] = jokes[Math.floor(Math.random() * jokes.length)];
      message.reply({ embeds: [embed('😂 Blague', `${setup}\n\n||${punchline}||`, COLORS.primary)] });
    }
  },

  meme: {
    category: 'Fun',
    description: 'Meme aléatoire',
    async execute(message) {
      try {
        const fetch = require('node-fetch');
        const res = await fetch('https://meme-api.com/gimme');
        const data = await res.json();
        const e = new EmbedBuilder().setTitle(data.title).setImage(data.url).setColor(COLORS.primary).setFooter({ text: `👍 ${data.ups} | r/${data.subreddit}` });
        message.reply({ embeds: [e] });
      } catch {
        message.reply({ embeds: [errorEmbed('Impossible de charger un mème.')] });
      }
    }
  },

  choose: {
    category: 'Fun',
    description: 'Choisir entre plusieurs options',
    usage: '!choose [option1] [option2] ...',
    async execute(message, args) {
      if (args.length < 2) return message.reply({ embeds: [errorEmbed('Donnez au moins 2 options séparées par des espaces.')] });
      const choix = args[Math.floor(Math.random() * args.length)];
      message.reply({ embeds: [embed('🎯 Choix', `J'ai choisi : **${choix}**`, COLORS.primary)] });
    }
  },

  poll: {
    category: 'Fun',
    description: 'Créer un sondage',
    usage: '!poll [question]',
    async execute(message, args) {
      const question = args.join(' ');
      if (!question) return message.reply({ embeds: [errorEmbed('Fournissez une question.')] });
      const e = embed('📊 Sondage', question, COLORS.primary);
      e.setFooter({ text: `Sondage créé par ${message.author.tag}` });
      const msg = await message.channel.send({ embeds: [e] });
      await msg.react('👍');
      await msg.react('👎');
      await msg.react('🤷');
      message.delete().catch(() => {});
    }
  },

  trivia: {
    category: 'Fun',
    description: 'Question de culture générale',
    async execute(message) {
      try {
        const fetch = require('node-fetch');
        const res = await fetch('https://opentdb.com/api.php?amount=1&type=multiple&lang=fr');
        const data = await res.json();
        const q = data.results[0];
        const answers = [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5);
        const letters = ['🇦', '🇧', '🇨', '🇩'];
        const e = embed(`❓ ${q.category}`, `**${q.question.replace(/&amp;/g, '&').replace(/&quot;/g, '"')}**\n\n${answers.map((a, i) => `${letters[i]} ${a}`).join('\n')}`, COLORS.primary);
        const msg = await message.reply({ embeds: [e] });
        answers.forEach((_, i) => msg.react(letters[i]));
      } catch {
        message.reply({ embeds: [errorEmbed('Impossible de charger une question.')] });
      }
    }
  },

  reverse: {
    category: 'Fun',
    description: 'Inverser un texte',
    usage: '!reverse [texte]',
    async execute(message, args) {
      const text = args.join(' ');
      if (!text) return message.reply({ embeds: [errorEmbed('Donnez un texte.')] });
      message.reply({ embeds: [embed('🔄 Texte inversé', text.split('').reverse().join(''), COLORS.primary)] });
    }
  },

  mock: {
    category: 'Fun',
    description: 'Moquer un texte',
    usage: '!mock [texte]',
    async execute(message, args) {
      const text = args.join(' ');
      if (!text) return message.reply({ embeds: [errorEmbed('Donnez un texte.')] });
      const result = text.split('').map((c, i) => i % 2 ? c.toUpperCase() : c.toLowerCase()).join('');
      message.reply({ embeds: [embed('🤡 Mock', result, COLORS.primary)] });
    }
  },

  ascii: {
    category: 'Fun',
    description: 'Texte en emojis lettres',
    usage: '!ascii [texte]',
    async execute(message, args) {
      const text = args.join(' ').toLowerCase().slice(0, 20);
      if (!text) return message.reply({ embeds: [errorEmbed('Donnez un texte.')] });
      const result = text.split('').map(c => /[a-z]/.test(c) ? `:regional_indicator_${c}: ` : c === ' ' ? '   ' : c).join('');
      message.reply(result.slice(0, 2000));
    }
  },

  slap: {
    category: 'Fun',
    description: 'Gifler quelqu\'un',
    usage: '!slap @membre',
    async execute(message, args) {
      const target = message.mentions.users.first();
      if (!target) return message.reply({ embeds: [errorEmbed('Mentionnez quelqu\'un.')] });
      message.reply({ embeds: [embed('👋 Giflé !', `**${message.author.username}** a giflé **${target.username}** ! 😵`, COLORS.primary)] });
    }
  },

  hug: {
    category: 'Fun',
    description: 'Faire un câlin',
    usage: '!hug @membre',
    async execute(message, args) {
      const target = message.mentions.users.first();
      if (!target) return message.reply({ embeds: [errorEmbed('Mentionnez quelqu\'un.')] });
      message.reply({ embeds: [embed('🤗 Câlin !', `**${message.author.username}** fait un câlin à **${target.username}** ! 💕`, COLORS.success)] });
    }
  },

  ship: {
    category: 'Fun',
    description: 'Compatibilité entre deux personnes',
    usage: '!ship @membre1 @membre2',
    async execute(message, args) {
      const u1 = message.mentions.users.first();
      const u2 = message.mentions.users.at(1) || message.author;
      const percent = Math.floor(Math.random() * 101);
      const hearts = '❤️'.repeat(Math.floor(percent / 10)) + '🖤'.repeat(10 - Math.floor(percent / 10));
      message.reply({ embeds: [embed('💘 Ship', `**${u1 ? u1.username : '???'}** + **${u2.username}**\n\n${hearts}\n\n**${percent}%** de compatibilité !`, COLORS.error)] });
    }
  },

  // ══════════════ 🛠 UTILITAIRES ══════════════
  embed_cmd: {
    category: 'Utilitaires',
    description: 'Créer un embed personnalisé',
    usage: '!embed [titre] | [description]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const [title, ...descParts] = args.join(' ').split('|');
      const desc = descParts.join('|').trim();
      if (!title) return message.reply({ embeds: [errorEmbed('Usage: !embed [titre] | [description]')] });
      await message.channel.send({ embeds: [embed(title.trim(), desc || '\u200b', COLORS.primary)] });
      message.delete().catch(() => {});
    }
  },

  say: {
    category: 'Utilitaires',
    description: 'Faire parler le bot',
    usage: '!say [message]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const text = args.join(' ');
      if (!text) return message.reply({ embeds: [errorEmbed('Donnez un message.')] });
      await message.channel.send(text);
      message.delete().catch(() => {});
    }
  },

  announce: {
    category: 'Utilitaires',
    description: 'Faire une annonce',
    usage: '!announce [message]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const text = args.join(' ');
      const e = new EmbedBuilder()
        .setTitle('📢 Annonce')
        .setDescription(text)
        .setColor(COLORS.warning)
        .setFooter({ text: `Par ${message.author.tag}` })
        .setTimestamp();
      message.channel.send({ content: '@here', embeds: [e] });
      message.delete().catch(() => {});
    }
  },

  remindme: {
    category: 'Utilitaires',
    description: 'Se faire rappeler quelque chose',
    usage: '!remindme [durée] [rappel]',
    async execute(message, args) {
      const duration = parseDuration(args[0]);
      if (!duration) return message.reply({ embeds: [errorEmbed('Durée invalide. Ex: 10m, 1h, 2d')] });
      const reminder = args.slice(1).join(' ') || 'Rappel !';
      message.reply({ embeds: [successEmbed(`⏰ Je vous rappellerai dans **${formatDuration(duration)}** : ${reminder}`)] });
      setTimeout(() => {
        message.author.send({ embeds: [embed('⏰ Rappel !', reminder, COLORS.info)] }).catch(() => {
          message.channel.send({ content: `<@${message.author.id}>`, embeds: [embed('⏰ Rappel !', reminder, COLORS.info)] });
        });
      }, duration);
    }
  },

  calc: {
    category: 'Utilitaires',
    description: 'Calculatrice',
    usage: '!calc [expression]',
    async execute(message, args) {
      const expr = args.join(' ');
      if (!expr) return message.reply({ embeds: [errorEmbed('Donnez une expression.')] });
      try {
        const result = Function('"use strict"; return (' + expr.replace(/[^0-9+\-*/().\s]/g, '') + ')')();
        message.reply({ embeds: [embed('🧮 Calcul', `**${expr}** = **${result}**`, COLORS.info)] });
      } catch {
        message.reply({ embeds: [errorEmbed('Expression invalide.')] });
      }
    }
  },

  channelinfo: {
    category: 'Utilitaires',
    description: 'Informations sur le salon actuel',
    async execute(message) {
      const c = message.channel;
      const e = embed(`📋 #${c.name}`, `**ID:** ${c.id}\n**Type:** ${c.type}\n**Créé le:** <t:${Math.floor(c.createdTimestamp / 1000)}:D>\n**Sujet:** ${c.topic || 'Aucun'}`, COLORS.info);
      message.reply({ embeds: [e] });
    }
  },

  roleinfo: {
    category: 'Utilitaires',
    description: 'Informations sur un rôle',
    usage: '!roleinfo @rôle',
    async execute(message, args) {
      const role = message.mentions.roles.first();
      if (!role) return message.reply({ embeds: [errorEmbed('Mentionnez un rôle.')] });
      const e = new EmbedBuilder()
        .setTitle(`🎭 ${role.name}`)
        .setColor(role.color || COLORS.primary)
        .addFields(
          { name: '🆔 ID', value: role.id, inline: true },
          { name: '👥 Membres', value: `${role.members.size}`, inline: true },
          { name: '📌 Position', value: `${role.position}`, inline: true },
          { name: '🎨 Couleur', value: role.hexColor, inline: true },
          { name: '📌 Mentionnable', value: role.mentionable ? 'Oui' : 'Non', inline: true },
          { name: '👑 Hoisted', value: role.hoist ? 'Oui' : 'Non', inline: true },
        )
        .setTimestamp();
      message.reply({ embeds: [e] });
    }
  },

  perms: {
    category: 'Utilitaires',
    description: 'Voir les permissions d\'un membre',
    usage: '!perms [@membre]',
    async execute(message, args) {
      const member = message.mentions.members.first() || message.member;
      const perms = member.permissions.toArray().map(p => `\`${p}\``).join(', ');
      message.reply({ embeds: [embed(`🔑 Permissions de ${member.user.tag}`, perms || 'Aucune', COLORS.info)] });
    }
  },

  timestamp: {
    category: 'Utilitaires',
    description: 'Afficher les timestamps Discord',
    usage: '!timestamp [date]',
    async execute(message, args) {
      const date = args.length ? new Date(args.join(' ')) : new Date();
      const unix = Math.floor(date.getTime() / 1000);
      if (isNaN(unix)) return message.reply({ embeds: [errorEmbed('Date invalide.')] });
      const formats = ['t', 'T', 'd', 'D', 'f', 'F', 'R'].map(f => `\`<t:${unix}:${f}>\` → <t:${unix}:${f}>`).join('\n');
      message.reply({ embeds: [embed('🕐 Timestamps', formats, COLORS.info)] });
    }
  },

  // ══════════════ ⚙️ CONFIG (Dyno) ══════════════
  setprefix: {
    category: 'Config',
    description: 'Changer le prefix du bot sur ce serveur',
    usage: '!setprefix [prefix]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const newPrefix = args[0];
      if (!newPrefix) return message.reply({ embeds: [errorEmbed('Donnez un prefix.')] });
      await db.set(`prefix_${message.guild.id}`, newPrefix);
      message.reply({ embeds: [successEmbed(`Prefix changé en \`${newPrefix}\``)] });
    }
  },

  setwelcome: {
    category: 'Config',
    description: 'Configurer le message de bienvenue',
    usage: '!setwelcome #salon [message]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const channel = message.mentions.channels.first();
      const msg = args.slice(1).join(' ');
      if (!channel) return message.reply({ embeds: [errorEmbed('Mentionnez un salon.')] });
      await db.set(`welcome_${message.guild.id}`, { channelId: channel.id, message: msg || 'Bienvenue {user} sur **{server}** ! 🎉' });
      message.reply({ embeds: [successEmbed(`Message de bienvenue configuré dans <#${channel.id}>.`)] });
    }
  },

  setleave: {
    category: 'Config',
    description: 'Configurer le message de départ',
    usage: '!setleave #salon [message]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const channel = message.mentions.channels.first();
      const msg = args.slice(1).join(' ');
      if (!channel) return message.reply({ embeds: [errorEmbed('Mentionnez un salon.')] });
      await db.set(`leave_${message.guild.id}`, { channelId: channel.id, message: msg || '**{user}** a quitté le serveur. 👋' });
      message.reply({ embeds: [successEmbed(`Message de départ configuré dans <#${channel.id}>.`)] });
    }
  },

  setlogs: {
    category: 'Config',
    description: 'Configurer le salon de logs',
    usage: '!setlogs #salon',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply({ embeds: [errorEmbed('Mentionnez un salon.')] });
      await db.set(`logs_${message.guild.id}`, channel.id);
      message.reply({ embeds: [successEmbed(`Salon de logs : <#${channel.id}>`)] });
    }
  },

  autorole: {
    category: 'Config',
    description: 'Rôle automatique à l\'arrivée',
    usage: '!autorole @rôle',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const role = message.mentions.roles.first();
      if (!role) {
        await db.delete(`autorole_${message.guild.id}`);
        return message.reply({ embeds: [successEmbed('Auto-rôle désactivé.')] });
      }
      await db.set(`autorole_${message.guild.id}`, role.id);
      message.reply({ embeds: [successEmbed(`Auto-rôle : **${role.name}**`)] });
    }
  },

  setlevelup: {
    category: 'Config',
    description: 'Salon d\'annonce des montées de niveau',
    usage: '!setlevelup #salon',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply({ embeds: [errorEmbed('Mentionnez un salon.')] });
      await db.set(`levelup_${message.guild.id}`, channel.id);
      message.reply({ embeds: [successEmbed(`Annonces de niveau dans <#${channel.id}>`)] });
    }
  },

  config: {
    category: 'Config',
    description: 'Voir la config du serveur',
    async execute(message) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const g = message.guild.id;
      const welcome = await db.get(`welcome_${g}`);
      const leave = await db.get(`leave_${g}`);
      const logs = await db.get(`logs_${g}`);
      const autorole = await db.get(`autorole_${g}`);
      const levelup = await db.get(`levelup_${g}`);
      const prefix = await db.get(`prefix_${g}`);
      const e = new EmbedBuilder()
        .setTitle(`⚙️ Config de ${message.guild.name}`)
        .setColor(COLORS.info)
        .addFields(
          { name: '🔤 Prefix', value: prefix || PREFIX, inline: true },
          { name: '👋 Bienvenue', value: welcome ? `<#${welcome.channelId}>` : 'Non configuré', inline: true },
          { name: '🚪 Départ', value: leave ? `<#${leave.channelId}>` : 'Non configuré', inline: true },
          { name: '📋 Logs', value: logs ? `<#${logs}>` : 'Non configuré', inline: true },
          { name: '🎭 Auto-rôle', value: autorole ? `<@&${autorole}>` : 'Non configuré', inline: true },
          { name: '⭐ Level-up', value: levelup ? `<#${levelup}>` : 'Non configuré', inline: true },
        )
        .setTimestamp();
      message.reply({ embeds: [e] });
    }
  },

  // ══════════════ 🎵 MUSIQUE BASIQUE ══════════════
  play: {
    category: 'Musique',
    description: 'Jouer de la musique (nom YouTube)',
    usage: '!play [titre]',
    async execute(message, args) {
      if (!message.member.voice.channel) return message.reply({ embeds: [errorEmbed('Rejoignez un salon vocal.')] });
      const query = args.join(' ');
      if (!query) return message.reply({ embeds: [errorEmbed('Donnez un titre ou lien YouTube.')] });
      message.reply({ embeds: [embed('🎵 Musique', `Recherche de **${query}**...\n\n⚠️ Installez \`@distube/distube\` pour la lecture audio.`, COLORS.primary)] });
    }
  },

  // ══════════════ 🎰 ECONOMIE ══════════════
  balance: {
    category: 'Économie',
    description: 'Voir votre solde',
    usage: '!balance [@membre]',
    async execute(message, args) {
      const user = message.mentions.users.first() || message.author;
      const coins = (await db.get(`coins_${message.guild.id}_${user.id}`)) || 0;
      message.reply({ embeds: [embed('💰 Solde', `**${user.username}** possède **${coins.toLocaleString()}** 💎`, COLORS.xp)] });
    }
  },

  daily: {
    category: 'Économie',
    description: 'Récompense journalière',
    async execute(message) {
      const key = `daily_${message.guild.id}_${message.author.id}`;
      const last = await db.get(key);
      const now = Date.now();
      if (last && now - last < 86400000) {
        const remaining = 86400000 - (now - last);
        return message.reply({ embeds: [errorEmbed(`Revenez dans **${formatDuration(remaining)}**.`)] });
      }
      const amount = Math.floor(Math.random() * 200) + 50;
      const coinKey = `coins_${message.guild.id}_${message.author.id}`;
      const current = (await db.get(coinKey)) || 0;
      await db.set(coinKey, current + amount);
      await db.set(key, now);
      message.reply({ embeds: [embed('🎁 Daily', `Vous avez reçu **${amount}** 💎 !\nSolde: **${current + amount}** 💎`, COLORS.success)] });
    }
  },

  weekly: {
    category: 'Économie',
    description: 'Récompense hebdomadaire',
    async execute(message) {
      const key = `weekly_${message.guild.id}_${message.author.id}`;
      const last = await db.get(key);
      const now = Date.now();
      if (last && now - last < 604800000) {
        const remaining = 604800000 - (now - last);
        return message.reply({ embeds: [errorEmbed(`Revenez dans **${formatDuration(remaining)}**.`)] });
      }
      const amount = Math.floor(Math.random() * 1000) + 500;
      const coinKey = `coins_${message.guild.id}_${message.author.id}`;
      const current = (await db.get(coinKey)) || 0;
      await db.set(coinKey, current + amount);
      await db.set(key, now);
      message.reply({ embeds: [embed('🗓 Weekly', `Vous avez reçu **${amount}** 💎 !\nSolde: **${current + amount}** 💎`, COLORS.success)] });
    }
  },

  work: {
    category: 'Économie',
    description: 'Travailler pour gagner des coins',
    async execute(message) {
      const key = `work_${message.guild.id}_${message.author.id}`;
      const last = await db.get(key);
      const now = Date.now();
      if (last && now - last < 3600000) {
        const remaining = 3600000 - (now - last);
        return message.reply({ embeds: [errorEmbed(`Revenez dans **${formatDuration(remaining)}**.`)] });
      }
      const jobs = ['🍕 Pizzaïolo', '💻 Développeur', '🎨 Artiste', '🚗 Chauffeur', '🏥 Docteur'];
      const job = jobs[Math.floor(Math.random() * jobs.length)];
      const amount = Math.floor(Math.random() * 100) + 20;
      const coinKey = `coins_${message.guild.id}_${message.author.id}`;
      const current = (await db.get(coinKey)) || 0;
      await db.set(coinKey, current + amount);
      await db.set(key, now);
      message.reply({ embeds: [embed('💼 Travail', `Vous travaillez comme **${job}** et gagnez **${amount}** 💎 !`, COLORS.success)] });
    }
  },

  pay: {
    category: 'Économie',
    description: 'Envoyer des coins à un membre',
    usage: '!pay @membre [montant]',
    async execute(message, args) {
      const target = message.mentions.users.first();
      const amount = parseInt(args[1]);
      if (!target || isNaN(amount) || amount <= 0) return message.reply({ embeds: [errorEmbed('Usage: !pay @membre [montant]')] });
      const fromKey = `coins_${message.guild.id}_${message.author.id}`;
      const toKey = `coins_${message.guild.id}_${target.id}`;
      const from = (await db.get(fromKey)) || 0;
      if (from < amount) return message.reply({ embeds: [errorEmbed('Solde insuffisant.')] });
      await db.set(fromKey, from - amount);
      const to = (await db.get(toKey)) || 0;
      await db.set(toKey, to + amount);
      message.reply({ embeds: [successEmbed(`Vous avez envoyé **${amount}** 💎 à **${target.username}**.`)] });
    }
  },

  slots: {
    category: 'Économie',
    description: 'Machine à sous',
    usage: '!slots [mise]',
    async execute(message, args) {
      const bet = parseInt(args[0]) || 10;
      const coinKey = `coins_${message.guild.id}_${message.author.id}`;
      const current = (await db.get(coinKey)) || 0;
      if (current < bet) return message.reply({ embeds: [errorEmbed('Solde insuffisant.')] });
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
      message.reply({ embeds: [embed('🎰 Slots', `${display}\n\n${win > 0 ? `🏆 Gagné **${win}** 💎 !` : `😔 Perdu **${bet}** 💎.`}\nSolde: **${current + net}** 💎`, win > 0 ? COLORS.success : COLORS.error)] });
    }
  },

  richlist: {
    category: 'Économie',
    description: 'Classement des plus riches',
    async execute(message) {
      const allData = await db.all();
      const guildData = allData
        .filter(e => e.id.startsWith(`coins_${message.guild.id}_`))
        .map(e => ({ userId: e.id.split('_')[2], coins: e.value }))
        .sort((a, b) => b.coins - a.coins)
        .slice(0, 10);
      if (!guildData.length) return message.reply({ embeds: [embed('💰 Top Riches', 'Aucune donnée.', COLORS.xp)] });
      const medals = ['🥇', '🥈', '🥉'];
      const list = guildData.map((d, i) => {
        const user = client.users.cache.get(d.userId);
        return `${medals[i] || `**${i+1}.**`} ${user ? user.tag : `<@${d.userId}>`} — **${d.coins.toLocaleString()}** 💎`;
      }).join('\n');
      message.reply({ embeds: [embed('💰 Top Riches', list, COLORS.xp)] });
    }
  },

  // ══════════════ 🎭 RÔLES RÉACTION (Circle) ══════════════
  reactionrole: {
    category: 'RôlesRéaction',
    description: 'Créer un message de rôles par réaction',
    usage: '!reactionrole #salon [emoji] [@rôle] [description]',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) return message.reply({ embeds: [errorEmbed('Permission insuffisante.')] });
      const channel = message.mentions.channels.first();
      const role = message.mentions.roles.first();
      if (!channel || !role || !args[1]) return message.reply({ embeds: [errorEmbed('Usage: !reactionrole #salon [emoji] @rôle')] });
      const emoji = args[1];
      const e = embed('🎭 Rôles par réaction', `Réagissez avec ${emoji} pour obtenir le rôle **${role.name}** !`, COLORS.primary);
      const msg = await channel.send({ embeds: [e] });
      await msg.react(emoji);
      await db.set(`rr_${msg.id}`, { roleId: role.id, emoji });
      message.reply({ embeds: [successEmbed(`Message de rôle créé dans <#${channel.id}>.`)] });
    }
  },

  // ══════════════ 🧑‍💻 OWNER ══════════════
  eval: {
    category: 'Owner',
    description: 'Exécuter du code JavaScript (Owner)',
    usage: '!eval [code]',
    async execute(message, args) {
      if (message.author.id !== OWNER_ID) return message.reply({ embeds: [errorEmbed('Commande réservée au propriétaire.')] });
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
    description: 'Recharger le bot',
    async execute(message) {
      if (message.author.id !== OWNER_ID) return;
      message.reply({ embeds: [successEmbed('Rechargement...')] }).then(() => process.exit(0));
    }
  },

  guilds: {
    category: 'Owner',
    description: 'Liste des serveurs du bot',
    async execute(message) {
      if (message.author.id !== OWNER_ID) return;
      const list = client.guilds.cache.map(g => `**${g.name}** — ${g.memberCount} membres`).join('\n');
      message.reply({ embeds: [embed(`🌐 Serveurs (${client.guilds.cache.size})`, list.slice(0, 4000) || 'Aucun', COLORS.info)] });
    }
  },

};

// Alias commandes embed
commands['clear'] = { ...commands.purge, description: 'Alias de !purge' };
commands['lb'] = { ...commands.leaderboard, description: 'Alias de !leaderboard' };
commands['bal'] = { ...commands.balance, description: 'Alias de !balance' };

// ─── Event: Message ───────────────────────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  // XP Auto
  if (Math.random() < 0.5) {
    const result = await addXP(message.member, Math.floor(Math.random() * 10) + 5);
    if (result.leveledUp) {
      const levelupChannel = await db.get(`levelup_${message.guild.id}`);
      const channel = levelupChannel ? message.guild.channels.cache.get(levelupChannel) : message.channel;
      channel?.send({ embeds: [embed('⭐ Niveau supérieur !', `<@${message.author.id}> a atteint le **niveau ${result.level}** ! 🎉`, COLORS.xp)] });
    }
  }

  const guildPrefix = (await db.get(`prefix_${message.guild.id}`)) || PREFIX;
  if (!message.content.startsWith(guildPrefix)) return;

  const args = message.content.slice(guildPrefix.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();
  const command = commands[commandName];
  if (!command) return;

  // Cooldown
  const cd = cooldowns.get(`${message.author.id}_${commandName}`);
  if (cd && Date.now() < cd) return message.reply({ embeds: [errorEmbed(`Attendez \`${Math.ceil((cd - Date.now()) / 1000)}s\`.`)] });
  cooldowns.set(`${message.author.id}_${commandName}`, Date.now() + 3000);

  try {
    await command.execute(message, args);
  } catch (err) {
    console.error(`[Erreur] ${commandName}:`, err);
    message.reply({ embeds: [errorEmbed('Une erreur est survenue.')] });
  }
});

// ─── Event: Membres ───────────────────────────────────────────────────────────
client.on('guildMemberAdd', async (member) => {
  // Message de bienvenue
  const welcome = await db.get(`welcome_${member.guild.id}`);
  if (welcome) {
    const channel = member.guild.channels.cache.get(welcome.channelId);
    const msg = welcome.message
      .replace('{user}', `<@${member.id}>`)
      .replace('{server}', member.guild.name)
      .replace('{count}', member.guild.memberCount);
    channel?.send({ embeds: [embed('👋 Bienvenue !', msg, COLORS.success)] });
  }
  // Auto-rôle
  const autorole = await db.get(`autorole_${member.guild.id}`);
  if (autorole) {
    const role = member.guild.roles.cache.get(autorole);
    if (role) member.roles.add(role).catch(() => {});
  }
});

client.on('guildMemberRemove', async (member) => {
  const leave = await db.get(`leave_${member.guild.id}`);
  if (leave) {
    const channel = member.guild.channels.cache.get(leave.channelId);
    const msg = leave.message
      .replace('{user}', member.user.tag)
      .replace('{server}', member.guild.name);
    channel?.send({ embeds: [embed('🚪 Départ', msg, COLORS.warning)] });
  }
});

// ─── Event: Réactions (rôles réaction) ───────────────────────────────────────
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

// ─── Event: Logs ─────────────────────────────────────────────────────────────
client.on('messageDelete', async (message) => {
  const logChannelId = await db.get(`logs_${message.guild?.id}`);
  if (!logChannelId || !message.guild) return;
  const channel = message.guild.channels.cache.get(logChannelId);
  if (!channel) return;
  channel.send({ embeds: [embed('🗑 Message supprimé', `**Auteur:** ${message.author?.tag || 'Inconnu'}\n**Salon:** <#${message.channelId}>\n**Contenu:** ${message.content?.slice(0, 500) || 'Aucun contenu'}`, COLORS.mod)] });
});

client.on('guildBanAdd', async (ban) => {
  const logChannelId = await db.get(`logs_${ban.guild.id}`);
  if (!logChannelId) return;
  const channel = ban.guild.channels.cache.get(logChannelId);
  channel?.send({ embeds: [embed('🔨 Membre banni', `**Utilisateur:** ${ban.user.tag}\n**Raison:** ${ban.reason || 'Aucune'}`, COLORS.mod)] });
});

// ─── Ready ────────────────────────────────────────────────────────────────────
client.once('ready', () => {
  const count = Object.keys(commands).length;
  console.log(`
╔══════════════════════════════════════╗
║   ✅ ${client.user.tag} connecté !        ║
║   📡 ${client.guilds.cache.size} serveur(s)               ║
║   📦 ${count} commandes chargées        ║
║   🔤 Préfixe : ${PREFIX}                    ║
╚══════════════════════════════════════╝
  `);
  client.user.setActivity(`${PREFIX}help | ${count} commandes`, { type: 3 });
});

// ─── Login ────────────────────────────────────────────────────────────────────
client.login(TOKEN);
