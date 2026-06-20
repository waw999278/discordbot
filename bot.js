require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

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

const xpData = {};
const warnData = {};
const xpCooldowns = new Set();

function getXP(guildId, userId) {
  const key = `${guildId}_${userId}`;
  if (!xpData[key]) xpData[key] = { xp: 0, level: 0, messages: 0 };
  return xpData[key];
}

function getLevelXP(level) {
  return 5 * (level ** 2) + 50 * level + 100;
}

function xpBar(current, needed) {
  const filled = Math.round((current / needed) * 20);
  return '█'.repeat(filled) + '░'.repeat(20 - filled);
}

client.once('ready', () => {
  console.log(`✅ Bot connecté: ${client.user.tag}`);
  client.user.setActivity('!help pour les commandes');
});

client.on('guildMemberAdd', member => {
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`👋 Bienvenue sur ${member.guild.name}!`)
    .setDescription(`Salut ${member}! Tu es le **${member.guild.memberCount}ème membre**! 🎉`)
    .setThumbnail(member.user.displayAvatarURL())
    .setTimestamp();
  const ch = member.guild.systemChannel;
  if (ch) ch.send({ embeds: [embed] });
});

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  // XP System
  const xpKey = `${message.guild.id}_${message.author.id}`;
  if (!xpCooldowns.has(xpKey)) {
    xpCooldowns.add(xpKey);
    setTimeout(() => xpCooldowns.delete(xpKey), 60000);
    const data = getXP(message.guild.id, message.author.id);
    data.xp += Math.floor(Math.random() * 15) + 5;
    data.messages += 1;
    if (data.xp >= getLevelXP(data.level + 1)) {
      data.level += 1;
      message.channel.send({ embeds: [
        new EmbedBuilder().setColor('#FFD700')
          .setDescription(`⬆️ ${message.author} est maintenant **niveau ${data.level}**! 🎉`)
      ]});
    }
  }

  if (!message.content.startsWith('!')) return;
  const args = message.content.slice(1).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  // HELP
  if (cmd === 'help') {
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📖 Commandes')
      .addFields(
        { name: '🛡️ Modération', value: '`!ban` `!kick` `!mute` `!warn` `!warns` `!purge` `!slowmode`' },
        { name: '⭐ Niveaux', value: '`!rank` `!leaderboard`' },
        { name: '🎉 Giveaway', value: '`!gcreate` `!greroll`' },
        { name: '🎭 Fun', value: '`!8ball` `!coinflip` `!dice` `!poll` `!avatar`' },
        { name: '🔧 Utilitaire', value: '`!ping` `!userinfo` `!serverinfo` `!announce`' },
      )
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  }

  // PING
  if (cmd === 'ping') {
    const sent = await message.reply('🏓 Calcul...');
    return sent.edit(`🏓 Pong! **${sent.createdTimestamp - message.createdTimestamp}ms**`);
  }

  // RANK
  if (cmd === 'rank') {
    const target = message.mentions.users.first() || message.author;
    const data = getXP(message.guild.id, target.id);
    const needed = getLevelXP(data.level + 1);
    return message.reply({ embeds: [
      new EmbedBuilder().setColor('#FFD700')
        .setTitle(`📊 Rang de ${target.username}`)
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: '🏆 Niveau', value: `**${data.level}**`, inline: true },
          { name: '⭐ XP', value: `**${data.xp}**`, inline: true },
          { name: '💬 Messages', value: `**${data.messages}**`, inline: true },
          { name: 'Progression', value: `\`${xpBar(data.xp % needed, needed)}\`\n${data.xp % needed}/${needed} XP` },
        )
    ]});
  }

  // LEADERBOARD
  if (cmd === 'leaderboard' || cmd === 'lb') {
    const entries = Object.entries(xpData)
      .filter(([k]) => k.startsWith(message.guild.id))
      .map(([k, v]) => ({ userId: k.split('_')[1], ...v }))
      .sort((a, b) => b.xp - a.xp).slice(0, 10);
    const medals = ['🥇','🥈','🥉'];
    return message.reply({ embeds: [
      new EmbedBuilder().setColor('#FFD700')
        .setTitle('🏆 Classement')
        .setDescription(entries.map((e, i) => `${medals[i] || `**${i+1}.**`} <@${e.userId}> — **${e.xp} XP** (Nv.${e.level})`).join('\n') || 'Aucune donnée.')
    ]});
  }

  // BAN
  if (cmd === 'ban') {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('❌ Permission refusée.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mentionne un membre.');
    const reason = args.slice(1).join(' ') || 'Aucune raison';
    await target.ban({ reason });
    return message.reply({ embeds: [new EmbedBuilder().setColor('#FF0000').setTitle('🔨 Banni').setDescription(`**${target.user.tag}** a été banni.\nRaison: ${reason}`)]});
  }

  // KICK
  if (cmd === 'kick') {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) return message.reply('❌ Permission refusée.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mentionne un membre.');
    const reason = args.slice(1).join(' ') || 'Aucune raison';
    await target.kick(reason);
    return message.reply({ embeds: [new EmbedBuilder().setColor('#FFA500').setTitle('👢 Expulsé').setDescription(`**${target.user.tag}** a été expulsé.\nRaison: ${reason}`)]});
  }

  // MUTE
  if (cmd === 'mute') {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ Permission refusée.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mentionne un membre.');
    const dur = args[1] || '10m';
    const match = dur.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return message.reply('❌ Durée invalide. Ex: 10m, 1h');
    const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    await target.timeout(parseInt(match[1]) * mult[match[2]], args.slice(2).join(' '));
    return message.reply({ embeds: [new EmbedBuilder().setColor('#808080').setDescription(`🔇 **${target.user.tag}** muté pendant **${dur}**.`)]});
  }

  // WARN
  if (cmd === 'warn') {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('❌ Permission refusée.');
    const target = message.mentions.members.first();
    if (!target) return message.reply('❌ Mentionne un membre.');
    const reason = args.slice(1).join(' ') || 'Aucune raison';
    const key = `${message.guild.id}_${target.id}`;
    if (!warnData[key]) warnData[key] = [];
    warnData[key].push({ reason, by: message.author.tag, date: new Date().toLocaleDateString() });
    return message.reply({ embeds: [new EmbedBuilder().setColor('#FFA500').setDescription(`⚠️ **${target.user.tag}** averti. Total: **${warnData[key].length}** avertissement(s).\nRaison: ${reason}`)]});
  }

  // WARNS
  if (cmd === 'warns') {
    const target = message.mentions.members.first() || message.member;
    const key = `${message.guild.id}_${target.id}`;
    const warns = warnData[key] || [];
    return message.reply({ embeds: [new EmbedBuilder().setColor('#FFA500')
      .setTitle(`⚠️ Avertissements de ${target.user.tag}`)
      .setDescription(warns.length ? warns.map((w,i) => `**${i+1}.** ${w.reason} — par ${w.by}`).join('\n') : 'Aucun avertissement.')
    ]});
  }

  // PURGE
  if (cmd === 'purge') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('❌ Permission refusée.');
    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100) return message.reply('❌ Nombre entre 1 et 100.');
    await message.delete();
    const deleted = await message.channel.bulkDelete(amount, true);
    const msg = await message.channel.send(`🗑️ **${deleted.size}** message(s) supprimé(s).`);
    setTimeout(() => msg.delete().catch(() => {}), 3000);
  }

  // SLOWMODE
  if (cmd === 'slowmode') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply('❌ Permission refusée.');
    const sec = parseInt(args[0]) || 0;
    await message.channel.setRateLimitPerUser(sec);
    return message.reply(`✅ Slowmode réglé à **${sec}s**.`);
  }

  // 8BALL
  if (cmd === '8ball') {
    const rep = ['✅ Oui!','✅ Absolument!','❌ Non.','❌ Certainement pas.','🟡 Peut-être...','🟡 Difficile à dire.'];
    return message.reply({ embeds: [new EmbedBuilder().setColor('#5865F2').setTitle('🎱 Boule Magique').setDescription(`**Question:** ${args.join(' ')}\n**Réponse:** ${rep[Math.floor(Math.random()*rep.length)]}`)]});
  }

  // COINFLIP
  if (cmd === 'coinflip') {
    return message.reply(`🪙 ${Math.random() < 0.5 ? 'Pile!' : 'Face!'}`);
  }

  // DICE
  if (cmd === 'dice') {
    const max = parseInt(args[0]) || 6;
    return message.reply(`🎲 Tu as obtenu **${Math.floor(Math.random()*max)+1}** sur un dé à **${max}** faces!`);
  }

  // AVATAR
  if (cmd === 'avatar') {
    const target = message.mentions.users.first() || message.author;
    return message.reply({ embeds: [new EmbedBuilder().setColor('#5865F2').setTitle(`🖼️ Avatar de ${target.username}`).setImage(target.displayAvatarURL({ dynamic: true, size: 1024 }))]});
  }

  // POLL
  if (cmd === 'poll') {
    const parts = message.content.match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, ''));
    if (!parts || parts.length < 2) return message.reply('❌ Usage: `!poll "Question" "Option1" "Option2"`');
    const [question, ...options] = parts;
    const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣'];
    const poll = await message.channel.send({ embeds: [
      new EmbedBuilder().setColor('#5865F2').setTitle(`📊 ${question}`)
        .setDescription(options.map((o,i) => `${emojis[i]} ${o}`).join('\n'))
    ]});
    for (let i = 0; i < options.length; i++) await poll.react(emojis[i]);
    message.delete().catch(() => {});
  }

  // USERINFO
  if (cmd === 'userinfo') {
    const target = message.mentions.members.first() || message.member;
    return message.reply({ embeds: [new EmbedBuilder().setColor('#5865F2')
      .setTitle(`👤 ${target.user.tag}`)
      .setThumbnail(target.user.displayAvatarURL())
      .addFields(
        { name: '🆔 ID', value: target.id, inline: true },
        { name: '📅 Compte créé', value: `<t:${Math.floor(target.user.createdTimestamp/1000)}:R>`, inline: true },
        { name: '📥 A rejoint', value: `<t:${Math.floor(target.joinedTimestamp/1000)}:R>`, inline: true },
      )
    ]});
  }

  // SERVERINFO
  if (cmd === 'serverinfo') {
    return message.reply({ embeds: [new EmbedBuilder().setColor('#5865F2')
      .setTitle(`🏠 ${message.guild.name}`)
      .setThumbnail(message.guild.iconURL())
      .addFields(
        { name: '👥 Membres', value: `${message.guild.memberCount}`, inline: true },
        { name: '💬 Salons', value: `${message.guild.channels.cache.size}`, inline: true },
        { name: '🎭 Rôles', value: `${message.guild.roles.cache.size}`, inline: true },
      )
    ]});
  }

  // ANNOUNCE
  if (cmd === 'announce') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply('❌ Permission refusée.');
    const ch = message.mentions.channels.first();
    if (!ch) return message.reply('❌ Mentionne un salon.');
    const text = args.slice(1).join(' ');
    if (!text) return message.reply('❌ Donne un texte.');
    await ch.send({ embeds: [new EmbedBuilder().setColor('#5865F2').setDescription(text).setFooter({ text: `Annonce par ${message.author.tag}` }).setTimestamp()]});
    return message.reply(`✅ Annonce envoyée dans ${ch}!`);
  }

  // GCREATE
  if (cmd === 'gcreate') {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply('❌ Permission refusée.');
    if (args.length < 3) return message.reply('❌ Usage: `!gcreate 1h 1 Prix`');
    const match = args[0].match(/^(\d+)(s|m|h|d)$/);
    if (!match) return message.reply('❌ Durée invalide.');
    const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const duration = parseInt(match[1]) * mult[match[2]];
    const winners = parseInt(args[1]);
    const prize = args.slice(2).join(' ');
    const endTime = new Date(Date.now() + duration);
    const gMsg = await message.channel.send({ embeds: [
      new EmbedBuilder().setColor('#FFD700').setTitle('🎉 GIVEAWAY 🎉')
        .setDescription(`**${prize}**\n\nRéagis avec 🎉!\n⏰ Fin: <t:${Math.floor(endTime/1000)}:R>\n🏆 Gagnants: **${winners}**\n👤 Par: ${message.author}`)
    ]});
    await gMsg.react('🎉');
    message.delete().catch(() => {});
    setTimeout(async () => {
      const reaction = gMsg.reactions.cache.get('🎉');
      const users = await reaction.users.fetch();
      const entries = users.filter(u => !u.bot).map(u => u);
      if (!entries.length) return message.channel.send('🎉 Personne n\'a participé au giveaway.');
      const winnersList = entries.sort(() => Math.random() - 0.5).slice(0, winners);
      message.channel.send(`🎉 Félicitations ${winnersList.join(', ')}! Vous avez gagné **${prize}**!`);
    }, duration);
  }

  // GREROLL
  if (cmd === 'greroll') {
    return message.reply('❌ Donne l\'ID du message du giveaway. Usage: `!greroll <messageId>`');
  }
});

client.login(process.env.DISCORD_TOKEN);
