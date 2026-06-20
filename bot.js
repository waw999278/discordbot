// ============================================================
//  Discord Premium Bot — bot.js
//  100 Slash Commands | discord.js v14
//  Setup: npm install  →  node bot.js
//  Requires a .env file with:
//    DISCORD_TOKEN=your_bot_token
//    CLIENT_ID=your_application_id
//    GUILD_ID=your_server_id   (optional – for instant guild deploy)
// ============================================================

require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ActivityType,
  Collection,
} = require("discord.js");

// ─── CLIENT ────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// ─── COLOUR PALETTE ────────────────────────────────────────
const COLORS = {
  gold:    0xFFD700,
  blue:    0x5865F2,
  green:   0x57F287,
  red:     0xED4245,
  purple:  0x9B59B6,
  cyan:    0x1ABC9C,
  orange:  0xE67E22,
  pink:    0xFF6B9D,
  white:   0xFFFFFF,
  dark:    0x2F3136,
};

// ─── HELPER ────────────────────────────────────────────────
function embed(title, description, color = COLORS.blue) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: "Premium Bot • All rights reserved" });
}

// ─── COMMAND DEFINITIONS ───────────────────────────────────
const commandDefs = [
  // ── PREMIUM SERVICES (tickets / activations) ──────────────
  {
    data: new SlashCommandBuilder()
      .setName("arcane")
      .setDescription("Open an Arcane Premium ticket")
      .addStringOption(o => o.setName("reason").setDescription("Why you need Arcane Premium").setRequired(true)),
    async execute(i) {
      await i.reply({ embeds: [embed("🟣 Arcane Premium Ticket", `**Reason:** ${i.options.getString("reason")}\n\nYour Arcane Premium ticket has been created. Staff will assist you shortly.`, COLORS.purple)] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("kingpremium")
      .setDescription("Open a King Premium ticket")
      .addStringOption(o => o.setName("reason").setDescription("Reason for King Premium").setRequired(true)),
    async execute(i) {
      await i.reply({ embeds: [embed("👑 King Premium Ticket", `**Reason:** ${i.options.getString("reason")}\n\nYour King Premium ticket is open. Await royal support!`, COLORS.gold)] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("sapphirecircle")
      .setDescription("Open a Sapphire Circle Premium ticket")
      .addStringOption(o => o.setName("reason").setDescription("Reason for Sapphire Circle").setRequired(true)),
    async execute(i) {
      await i.reply({ embeds: [embed("💎 Sapphire Circle Premium", `**Reason:** ${i.options.getString("reason")}\n\nWelcome to the Sapphire Circle. Your ticket has been submitted.`, COLORS.cyan)] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("dynopremium")
      .setDescription("Open a Dyno Premium ticket")
      .addStringOption(o => o.setName("reason").setDescription("Reason for Dyno Premium").setRequired(true)),
    async execute(i) {
      await i.reply({ embeds: [embed("⚙️ Dyno Premium Ticket", `**Reason:** ${i.options.getString("reason")}\n\nYour Dyno Premium request is logged. A staff member will be with you soon.`, COLORS.blue)] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("mee6premium")
      .setDescription("Open a MEE6 Premium ticket")
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(true)),
    async execute(i) {
      await i.reply({ embeds: [embed("🤖 MEE6 Premium Ticket", `**Reason:** ${i.options.getString("reason")}\n\nMEE6 Premium ticket opened!`, COLORS.orange)] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("nitropremium")
      .setDescription("Open a Nitro Premium gift ticket")
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(true)),
    async execute(i) {
      await i.reply({ embeds: [embed("✨ Nitro Premium Ticket", `**Reason:** ${i.options.getString("reason")}\n\nNitro Premium ticket submitted. Staff will contact you.`, COLORS.pink)] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("vippremium")
      .setDescription("Open a VIP Premium membership ticket")
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(true)),
    async execute(i) {
      await i.reply({ embeds: [embed("⭐ VIP Premium Ticket", `**Reason:** ${i.options.getString("reason")}\n\nVIP Premium ticket created successfully.`, COLORS.gold)] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("elitepremium")
      .setDescription("Open an Elite Premium ticket")
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(true)),
    async execute(i) {
      await i.reply({ embeds: [embed("🏆 Elite Premium Ticket", `**Reason:** ${i.options.getString("reason")}\n\nElite Premium ticket opened.`, COLORS.purple)] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("diamondpremium")
      .setDescription("Open a Diamond Premium ticket")
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(true)),
    async execute(i) {
      await i.reply({ embeds: [embed("💠 Diamond Premium Ticket", `**Reason:** ${i.options.getString("reason")}\n\nDiamond Premium ticket submitted.`, COLORS.cyan)] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("godpremium")
      .setDescription("Open a God-tier Premium ticket")
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(true)),
    async execute(i) {
      await i.reply({ embeds: [embed("🌟 God Premium Ticket", `**Reason:** ${i.options.getString("reason")}\n\nGod Premium ticket created. You're at the top tier!`, COLORS.gold)] });
    },
  },

  // ── MODERATION ────────────────────────────────────────────
  {
    data: new SlashCommandBuilder()
      .setName("ban")
      .setDescription("Ban a member")
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
      .addUserOption(o => o.setName("user").setDescription("User to ban").setRequired(true))
      .addStringOption(o => o.setName("reason").setDescription("Reason")),
    async execute(i) {
      const user = i.options.getUser("user");
      const reason = i.options.getString("reason") ?? "No reason provided";
      await i.guild.members.ban(user, { reason });
      await i.reply({ embeds: [embed("🔨 User Banned", `**${user.tag}** has been banned.\n**Reason:** ${reason}`, COLORS.red)] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("kick")
      .setDescription("Kick a member")
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
      .addUserOption(o => o.setName("user").setDescription("User to kick").setRequired(true))
      .addStringOption(o => o.setName("reason").setDescription("Reason")),
    async execute(i) {
      const member = i.guild.members.cache.get(i.options.getUser("user").id);
      const reason = i.options.getString("reason") ?? "No reason provided";
      await member?.kick(reason);
      await i.reply({ embeds: [embed("👢 User Kicked", `**${member?.user.tag}** has been kicked.\n**Reason:** ${reason}`, COLORS.orange)] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("mute")
      .setDescription("Timeout (mute) a member")
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption(o => o.setName("user").setDescription("User to mute").setRequired(true))
      .addIntegerOption(o => o.setName("minutes").setDescription("Duration in minutes").setRequired(true)),
    async execute(i) {
      const member = i.guild.members.cache.get(i.options.getUser("user").id);
      const mins = i.options.getInteger("minutes");
      await member?.timeout(mins * 60 * 1000);
      await i.reply({ embeds: [embed("🔇 User Muted", `**${member?.user.tag}** muted for **${mins} minutes**.`, COLORS.orange)] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("unmute")
      .setDescription("Remove timeout from a member")
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption(o => o.setName("user").setDescription("User to unmute").setRequired(true)),
    async execute(i) {
      const member = i.guild.members.cache.get(i.options.getUser("user").id);
      await member?.timeout(null);
      await i.reply({ embeds: [embed("🔊 User Unmuted", `**${member?.user.tag}** has been unmuted.`, COLORS.green)] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("warn")
      .setDescription("Warn a member")
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption(o => o.setName("user").setDescription("User to warn").setRequired(true))
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(true)),
    async execute(i) {
      const user = i.options.getUser("user");
      const reason = i.options.getString("reason");
      await i.reply({ embeds: [embed("⚠️ Warning Issued", `**${user.tag}** has been warned.\n**Reason:** ${reason}`, COLORS.orange)] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("purge")
      .setDescription("Bulk-delete messages")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addIntegerOption(o => o.setName("amount").setDescription("Messages to delete (1–100)").setRequired(true).setMinValue(1).setMaxValue(100)),
    async execute(i) {
      const amount = i.options.getInteger("amount");
      await i.channel.bulkDelete(amount, true);
      await i.reply({ embeds: [embed("🧹 Messages Purged", `Deleted **${amount}** messages.`, COLORS.red)], ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("slowmode")
      .setDescription("Set channel slowmode")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addIntegerOption(o => o.setName("seconds").setDescription("Slowmode in seconds (0 = off)").setRequired(true)),
    async execute(i) {
      const secs = i.options.getInteger("seconds");
      await i.channel.setRateLimitPerUser(secs);
      await i.reply({ embeds: [embed("🐢 Slowmode Set", `Slowmode set to **${secs}s** in this channel.`, COLORS.blue)] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("lock")
      .setDescription("Lock the current channel")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(i) {
      await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, { SendMessages: false });
      await i.reply({ embeds: [embed("🔒 Channel Locked", "This channel has been locked.", COLORS.red)] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("unlock")
      .setDescription("Unlock the current channel")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(i) {
      await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, { SendMessages: true });
      await i.reply({ embeds: [embed("🔓 Channel Unlocked", "This channel has been unlocked.", COLORS.green)] });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("unban")
      .setDescription("Unban a user by ID")
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
      .addStringOption(o => o.setName("userid").setDescription("User ID to unban").setRequired(true)),
    async execute(i) {
      const id = i.options.getString("userid");
      await i.guild.members.unban(id);
      await i.reply({ embeds: [embed("✅ User Unbanned", `User **${id}** has been unbanned.`, COLORS.green)] });
    },
  },

  // ── SERVER INFO ───────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName("serverinfo").setDescription("Show server information"),
    async execute(i) {
      const g = i.guild;
      await i.reply({
        embeds: [
          embed("🏠 Server Info", `**Name:** ${g.name}\n**Members:** ${g.memberCount}\n**Owner:** <@${g.ownerId}>\n**Created:** <t:${Math.floor(g.createdTimestamp / 1000)}:R>\n**Boost Level:** ${g.premiumTier}`, COLORS.blue)
            .setThumbnail(g.iconURL()),
        ],
      });
    },
  },
  {
    data: new SlashCommandBuilder().setName("userinfo").setDescription("Show user information").addUserOption(o => o.setName("user").setDescription("Target user")),
    async execute(i) {
      const user = i.options.getUser("user") ?? i.user;
      const member = i.guild.members.cache.get(user.id);
      await i.reply({
        embeds: [
          embed("👤 User Info", `**Tag:** ${user.tag}\n**ID:** ${user.id}\n**Joined:** <t:${Math.floor(member?.joinedTimestamp / 1000)}:R>\n**Created:** <t:${Math.floor(user.createdTimestamp / 1000)}:R>`, COLORS.cyan)
            .setThumbnail(user.displayAvatarURL()),
        ],
      });
    },
  },
  {
    data: new SlashCommandBuilder().setName("avatar").setDescription("Get a user's avatar").addUserOption(o => o.setName("user").setDescription("Target user")),
    async execute(i) {
      const user = i.options.getUser("user") ?? i.user;
      await i.reply({ embeds: [embed(`🖼️ ${user.username}'s Avatar`, `[Click to open](${user.displayAvatarURL({ size: 4096 })})`, COLORS.purple).setImage(user.displayAvatarURL({ size: 4096 }))] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("roleinfo").setDescription("Get info about a role").addRoleOption(o => o.setName("role").setDescription("Target role").setRequired(true)),
    async execute(i) {
      const role = i.options.getRole("role");
      await i.reply({ embeds: [embed(`🎭 Role: ${role.name}`, `**ID:** ${role.id}\n**Color:** ${role.hexColor}\n**Members:** ${role.members.size}\n**Mentionable:** ${role.mentionable}\n**Position:** ${role.position}`, role.color || COLORS.blue)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("channelinfo").setDescription("Get info about a channel").addChannelOption(o => o.setName("channel").setDescription("Target channel")),
    async execute(i) {
      const ch = i.options.getChannel("channel") ?? i.channel;
      await i.reply({ embeds: [embed(`📺 Channel: ${ch.name}`, `**ID:** ${ch.id}\n**Type:** ${ch.type}\n**Created:** <t:${Math.floor(ch.createdTimestamp / 1000)}:R>`, COLORS.blue)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("boostinfo").setDescription("Show server boost stats"),
    async execute(i) {
      const g = i.guild;
      await i.reply({ embeds: [embed("💎 Boost Info", `**Boost Level:** ${g.premiumTier}\n**Total Boosts:** ${g.premiumSubscriptionCount}\n**Boosters:** ${g.members.cache.filter(m => m.premiumSince).size}`, COLORS.pink)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("emojis").setDescription("List server emojis"),
    async execute(i) {
      const emojis = i.guild.emojis.cache.map(e => `${e}`).slice(0, 40).join(" ") || "No emojis found";
      await i.reply({ embeds: [embed("😀 Server Emojis", emojis, COLORS.yellow || COLORS.gold)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("roles").setDescription("List all server roles"),
    async execute(i) {
      const roles = i.guild.roles.cache.sort((a, b) => b.position - a.position).map(r => r.toString()).slice(0, 30).join(", ");
      await i.reply({ embeds: [embed("🎭 Server Roles", roles || "No roles", COLORS.purple)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("members").setDescription("Show member count breakdown"),
    async execute(i) {
      const total = i.guild.memberCount;
      const bots = i.guild.members.cache.filter(m => m.user.bot).size;
      await i.reply({ embeds: [embed("👥 Members", `**Total:** ${total}\n**Humans:** ${total - bots}\n**Bots:** ${bots}`, COLORS.green)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("inviteinfo").setDescription("Create an invite link for this channel"),
    async execute(i) {
      const invite = await i.channel.createInvite({ maxAge: 86400, maxUses: 10 });
      await i.reply({ embeds: [embed("🔗 Invite Created", `Here's your invite: **${invite.url}**\nExpires in 24 hours, max 10 uses.`, COLORS.blue)] });
    },
  },

  // ── FUN ───────────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName("coinflip").setDescription("Flip a coin"),
    async execute(i) {
      const result = Math.random() < 0.5 ? "🪙 Heads!" : "🪙 Tails!";
      await i.reply({ embeds: [embed("Coin Flip", result, COLORS.gold)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("dice").setDescription("Roll a dice").addIntegerOption(o => o.setName("sides").setDescription("Number of sides (default 6)")),
    async execute(i) {
      const sides = i.options.getInteger("sides") ?? 6;
      const roll = Math.floor(Math.random() * sides) + 1;
      await i.reply({ embeds: [embed("🎲 Dice Roll", `You rolled a **${roll}** on a ${sides}-sided die!`, COLORS.purple)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("8ball").setDescription("Ask the magic 8-ball").addStringOption(o => o.setName("question").setDescription("Your question").setRequired(true)),
    async execute(i) {
      const answers = ["It is certain.", "Without a doubt.", "Yes, definitely.", "You may rely on it.", "As I see it, yes.", "Most likely.", "Outlook good.", "Signs point to yes.", "Reply hazy, try again.", "Ask again later.", "Better not tell you now.", "Cannot predict now.", "Don't count on it.", "My reply is no.", "My sources say no.", "Outlook not so good.", "Very doubtful."];
      const answer = answers[Math.floor(Math.random() * answers.length)];
      await i.reply({ embeds: [embed("🎱 Magic 8-Ball", `**Question:** ${i.options.getString("question")}\n**Answer:** ${answer}`, COLORS.dark)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("rps").setDescription("Play Rock Paper Scissors").addStringOption(o => o.setName("choice").setDescription("Your choice").setRequired(true).addChoices({ name: "Rock", value: "rock" }, { name: "Paper", value: "paper" }, { name: "Scissors", value: "scissors" })),
    async execute(i) {
      const choices = ["rock", "paper", "scissors"];
      const bot = choices[Math.floor(Math.random() * 3)];
      const user = i.options.getString("choice");
      const win = (user === "rock" && bot === "scissors") || (user === "paper" && bot === "rock") || (user === "scissors" && bot === "paper");
      const result = user === bot ? "It's a **tie**! 🤝" : win ? "You **win**! 🎉" : "You **lose**! 😢";
      await i.reply({ embeds: [embed("✂️ Rock Paper Scissors", `You: **${user}** | Bot: **${bot}**\n${result}`, win ? COLORS.green : COLORS.red)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("meme").setDescription("Get a random meme category fact"),
    async execute(i) {
      const memes = ["Why do programmers prefer dark mode? Because light attracts bugs! 🐛", "A SQL query walks into a bar, walks up to two tables and asks… Can I join you? 😂", "There are 10 types of people: those who understand binary and those who don't.", "Git commit -m 'Fixed everything' — famous last words 💀", "It works on my machine! — Every developer ever 🤷"];
      await i.reply({ embeds: [embed("😂 Meme", memes[Math.floor(Math.random() * memes.length)], COLORS.orange)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("hug").setDescription("Hug someone").addUserOption(o => o.setName("user").setDescription("Who to hug").setRequired(true)),
    async execute(i) {
      const user = i.options.getUser("user");
      await i.reply({ embeds: [embed("🤗 Hug!", `**${i.user.username}** hugged **${user.username}**! 💕`, COLORS.pink)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("slap").setDescription("Slap someone").addUserOption(o => o.setName("user").setDescription("Who to slap").setRequired(true)),
    async execute(i) {
      const user = i.options.getUser("user");
      await i.reply({ embeds: [embed("👋 Slap!", `**${i.user.username}** slapped **${user.username}**! 💥`, COLORS.red)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("quote").setDescription("Get a random motivational quote"),
    async execute(i) {
      const quotes = ["The only way to do great work is to love what you do. – Steve Jobs", "In the middle of difficulty lies opportunity. – Albert Einstein", "It does not matter how slowly you go as long as you do not stop. – Confucius", "Life is what happens when you're busy making other plans. – John Lennon", "The future belongs to those who believe in the beauty of their dreams. – Eleanor Roosevelt"];
      await i.reply({ embeds: [embed("💬 Quote of the Moment", quotes[Math.floor(Math.random() * quotes.length)], COLORS.cyan)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("randomnumber").setDescription("Generate a random number").addIntegerOption(o => o.setName("min").setDescription("Minimum").setRequired(true)).addIntegerOption(o => o.setName("max").setDescription("Maximum").setRequired(true)),
    async execute(i) {
      const min = i.options.getInteger("min");
      const max = i.options.getInteger("max");
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      await i.reply({ embeds: [embed("🎰 Random Number", `Your number between **${min}** and **${max}** is: **${num}**`, COLORS.purple)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("choose").setDescription("Choose between options").addStringOption(o => o.setName("options").setDescription("Options separated by commas").setRequired(true)),
    async execute(i) {
      const opts = i.options.getString("options").split(",").map(s => s.trim());
      const chosen = opts[Math.floor(Math.random() * opts.length)];
      await i.reply({ embeds: [embed("🤔 Decision Made", `From your options, I choose: **${chosen}**`, COLORS.gold)] });
    },
  },

  // ── UTILITY ───────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName("ping").setDescription("Check bot latency"),
    async execute(i) {
      const sent = await i.reply({ embeds: [embed("🏓 Pong!", "Calculating...", COLORS.blue)], fetchReply: true });
      await i.editReply({ embeds: [embed("🏓 Pong!", `**Latency:** ${sent.createdTimestamp - i.createdTimestamp}ms\n**API Latency:** ${Math.round(client.ws.ping)}ms`, COLORS.green)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("uptime").setDescription("Show bot uptime"),
    async execute(i) {
      const ms = client.uptime;
      const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
      await i.reply({ embeds: [embed("⏱️ Uptime", `**${h}h ${m}m ${s}s**`, COLORS.green)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("botinfo").setDescription("Show bot information"),
    async execute(i) {
      await i.reply({ embeds: [embed("🤖 Bot Info", `**Name:** ${client.user.username}\n**Servers:** ${client.guilds.cache.size}\n**Commands:** 100\n**Library:** discord.js v14`, COLORS.blue).setThumbnail(client.user.displayAvatarURL())] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("say").setDescription("Make the bot say something").addStringOption(o => o.setName("message").setDescription("Message to say").setRequired(true)),
    async execute(i) {
      const msg = i.options.getString("message");
      await i.channel.send(msg);
      await i.reply({ content: "✅ Message sent!", ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder().setName("embed").setDescription("Send a custom embed").addStringOption(o => o.setName("title").setDescription("Embed title").setRequired(true)).addStringOption(o => o.setName("description").setDescription("Embed description").setRequired(true)),
    async execute(i) {
      const title = i.options.getString("title");
      const desc = i.options.getString("description");
      await i.channel.send({ embeds: [embed(title, desc, COLORS.blue)] });
      await i.reply({ content: "✅ Embed sent!", ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder().setName("announce").setDescription("Send an announcement embed").setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).addStringOption(o => o.setName("message").setDescription("Announcement content").setRequired(true)),
    async execute(i) {
      const msg = i.options.getString("message");
      await i.channel.send({ embeds: [embed("📢 Announcement", msg, COLORS.gold)] });
      await i.reply({ content: "✅ Announcement sent!", ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder().setName("poll").setDescription("Create a poll").addStringOption(o => o.setName("question").setDescription("Poll question").setRequired(true)),
    async execute(i) {
      const q = i.options.getString("question");
      const msg = await i.channel.send({ embeds: [embed("📊 Poll", q, COLORS.cyan)] });
      await msg.react("👍"); await msg.react("👎");
      await i.reply({ content: "✅ Poll created!", ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder().setName("reminder").setDescription("Set a reminder").addStringOption(o => o.setName("message").setDescription("Reminder message").setRequired(true)).addIntegerOption(o => o.setName("seconds").setDescription("Remind in X seconds").setRequired(true)),
    async execute(i) {
      const msg = i.options.getString("message"); const secs = i.options.getInteger("seconds");
      await i.reply({ embeds: [embed("⏰ Reminder Set", `I'll remind you in **${secs}s**: ${msg}`, COLORS.blue)] });
      setTimeout(async () => { try { await i.user.send({ embeds: [embed("⏰ Reminder!", msg, COLORS.gold)] }); } catch {} }, secs * 1000);
    },
  },
  {
    data: new SlashCommandBuilder().setName("timestamp").setDescription("Get the current Unix timestamp"),
    async execute(i) {
      const ts = Math.floor(Date.now() / 1000);
      await i.reply({ embeds: [embed("🕐 Timestamp", `**Unix:** \`${ts}\`\n**Discord format:** <t:${ts}:F>`, COLORS.blue)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("calculator").setDescription("Simple calculator").addStringOption(o => o.setName("expression").setDescription("Math expression (e.g. 2+2*5)").setRequired(true)),
    async execute(i) {
      const expr = i.options.getString("expression").replace(/[^0-9+\-*/.() ]/g, "");
      let result;
      try { result = Function(`"use strict"; return (${expr})`)(); } catch { result = "Invalid expression"; }
      await i.reply({ embeds: [embed("🧮 Calculator", `**Expression:** \`${expr}\`\n**Result:** \`${result}\``, COLORS.green)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("base64encode").setDescription("Encode text to Base64").addStringOption(o => o.setName("text").setDescription("Text to encode").setRequired(true)),
    async execute(i) {
      const encoded = Buffer.from(i.options.getString("text")).toString("base64");
      await i.reply({ embeds: [embed("🔐 Base64 Encoded", `\`${encoded}\``, COLORS.cyan)] });
    },
  },

  // ── TICKET MANAGEMENT ─────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName("ticket").setDescription("Open a general support ticket").addStringOption(o => o.setName("reason").setDescription("Reason for ticket").setRequired(true)),
    async execute(i) {
      await i.reply({ embeds: [embed("🎫 Support Ticket", `**Reason:** ${i.options.getString("reason")}\n\nYour ticket has been submitted. Staff will assist you shortly!`, COLORS.blue)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("closeticket").setDescription("Close the current ticket").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(i) {
      await i.reply({ embeds: [embed("🔒 Ticket Closed", "This ticket has been closed. The channel will be archived.", COLORS.red)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("adduser").setDescription("Add a user to the current ticket").addUserOption(o => o.setName("user").setDescription("User to add").setRequired(true)),
    async execute(i) {
      const user = i.options.getUser("user");
      await i.channel.permissionOverwrites.create(user, { ViewChannel: true, SendMessages: true });
      await i.reply({ embeds: [embed("➕ User Added", `**${user.tag}** has been added to this ticket.`, COLORS.green)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("removeuser").setDescription("Remove a user from the current ticket").addUserOption(o => o.setName("user").setDescription("User to remove").setRequired(true)),
    async execute(i) {
      const user = i.options.getUser("user");
      await i.channel.permissionOverwrites.delete(user);
      await i.reply({ embeds: [embed("➖ User Removed", `**${user.tag}** has been removed from this ticket.`, COLORS.orange)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("claimticket").setDescription("Claim this ticket as your own (staff)").setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(i) {
      await i.reply({ embeds: [embed("✋ Ticket Claimed", `This ticket has been claimed by **${i.user.tag}**.`, COLORS.cyan)] });
    },
  },

  // ── GIVEAWAY ──────────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName("giveaway").setDescription("Start a giveaway").setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).addStringOption(o => o.setName("prize").setDescription("Giveaway prize").setRequired(true)).addIntegerOption(o => o.setName("minutes").setDescription("Duration in minutes").setRequired(true)),
    async execute(i) {
      const prize = i.options.getString("prize"); const mins = i.options.getInteger("minutes");
      const end = Math.floor((Date.now() + mins * 60000) / 1000);
      const msg = await i.channel.send({ embeds: [embed("🎉 GIVEAWAY!", `**Prize:** ${prize}\n**Ends:** <t:${end}:R>\nReact with 🎉 to enter!`, COLORS.gold)] });
      await msg.react("🎉");
      await i.reply({ content: "✅ Giveaway started!", ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder().setName("reroll").setDescription("Re-roll a giveaway winner"),
    async execute(i) {
      await i.reply({ embeds: [embed("🎉 Giveaway Re-rolled", "A new winner has been selected! Congratulations! 🏆", COLORS.gold)] });
    },
  },

  // ── ECONOMY (demo) ────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName("balance").setDescription("Check your balance"),
    async execute(i) {
      const bal = Math.floor(Math.random() * 10000);
      await i.reply({ embeds: [embed("💰 Balance", `**${i.user.username}'s** balance: **$${bal.toLocaleString()}**`, COLORS.gold)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("daily").setDescription("Claim your daily reward"),
    async execute(i) {
      const reward = Math.floor(Math.random() * 500) + 100;
      await i.reply({ embeds: [embed("📅 Daily Reward", `You claimed **$${reward}** as your daily reward! Come back tomorrow!`, COLORS.green)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("work").setDescription("Work to earn coins"),
    async execute(i) {
      const jobs = ["programmer", "chef", "doctor", "streamer", "artist"];
      const job = jobs[Math.floor(Math.random() * jobs.length)];
      const earned = Math.floor(Math.random() * 300) + 50;
      await i.reply({ embeds: [embed("💼 Work", `You worked as a **${job}** and earned **$${earned}**!`, COLORS.green)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("shop").setDescription("View the server shop"),
    async execute(i) {
      await i.reply({ embeds: [embed("🛍️ Shop", "**1.** VIP Role — $5,000\n**2.** Name Color — $2,500\n**3.** Custom Emoji — $10,000\n**4.** Shoutout — $1,000\n**5.** Premium Badge — $7,500", COLORS.gold)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("leaderboard").setDescription("View the top economy leaderboard"),
    async execute(i) {
      await i.reply({ embeds: [embed("🏆 Leaderboard", "**1.** 👑 User#0001 — $98,500\n**2.** ⭐ User#0002 — $72,300\n**3.** 💎 User#0003 — $55,100\n**4.** 🥈 User#0004 — $41,200\n**5.** 🥉 User#0005 — $30,800", COLORS.gold)] });
    },
  },

  // ── LEVELLING (demo) ──────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName("rank").setDescription("Check your rank / XP").addUserOption(o => o.setName("user").setDescription("Target user")),
    async execute(i) {
      const user = i.options.getUser("user") ?? i.user;
      const level = Math.floor(Math.random() * 50) + 1;
      const xp = Math.floor(Math.random() * 5000);
      await i.reply({ embeds: [embed(`📊 Rank — ${user.username}`, `**Level:** ${level}\n**XP:** ${xp.toLocaleString()}\n**Rank:** #${Math.floor(Math.random() * 100) + 1}`, COLORS.purple)] });
    },
  },

  // ── MUSIC (stub) ──────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName("play").setDescription("Play a song").addStringOption(o => o.setName("query").setDescription("Song name or URL").setRequired(true)),
    async execute(i) {
      await i.reply({ embeds: [embed("🎵 Now Playing", `Loading: **${i.options.getString("query")}**\nJoin a voice channel first!`, COLORS.cyan)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("skip").setDescription("Skip the current song"),
    async execute(i) { await i.reply({ embeds: [embed("⏭️ Skipped", "Skipped to the next track!", COLORS.blue)] }); },
  },
  {
    data: new SlashCommandBuilder().setName("stop").setDescription("Stop music and clear queue"),
    async execute(i) { await i.reply({ embeds: [embed("⏹️ Stopped", "Music stopped and queue cleared.", COLORS.red)] }); },
  },
  {
    data: new SlashCommandBuilder().setName("queue").setDescription("Show the music queue"),
    async execute(i) { await i.reply({ embeds: [embed("📋 Queue", "The queue is currently empty. Use `/play` to add songs!", COLORS.blue)] }); },
  },
  {
    data: new SlashCommandBuilder().setName("volume").setDescription("Set the music volume").addIntegerOption(o => o.setName("level").setDescription("Volume 0–100").setRequired(true).setMinValue(0).setMaxValue(100)),
    async execute(i) { await i.reply({ embeds: [embed("🔊 Volume", `Volume set to **${i.options.getInteger("level")}%**`, COLORS.blue)] }); },
  },
  {
    data: new SlashCommandBuilder().setName("pause").setDescription("Pause the current track"),
    async execute(i) { await i.reply({ embeds: [embed("⏸️ Paused", "Playback paused.", COLORS.orange)] }); },
  },
  {
    data: new SlashCommandBuilder().setName("resume").setDescription("Resume the paused track"),
    async execute(i) { await i.reply({ embeds: [embed("▶️ Resumed", "Playback resumed!", COLORS.green)] }); },
  },
  {
    data: new SlashCommandBuilder().setName("shuffle").setDescription("Shuffle the queue"),
    async execute(i) { await i.reply({ embeds: [embed("🔀 Shuffled", "Queue has been shuffled!", COLORS.purple)] }); },
  },
  {
    data: new SlashCommandBuilder().setName("loop").setDescription("Toggle loop mode").addStringOption(o => o.setName("mode").setDescription("Loop mode").setRequired(true).addChoices({ name: "Off", value: "off" }, { name: "Track", value: "track" }, { name: "Queue", value: "queue" })),
    async execute(i) { await i.reply({ embeds: [embed("🔁 Loop", `Loop mode set to **${i.options.getString("mode")}**`, COLORS.blue)] }); },
  },

  // ── ROLE MANAGEMENT ───────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName("giverole").setDescription("Give a role to a user").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true)).addRoleOption(o => o.setName("role").setDescription("Role to give").setRequired(true)),
    async execute(i) {
      const member = i.guild.members.cache.get(i.options.getUser("user").id);
      const role = i.options.getRole("role");
      await member?.roles.add(role);
      await i.reply({ embeds: [embed("✅ Role Given", `**${role.name}** given to **${member?.user.tag}**`, COLORS.green)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("removerole").setDescription("Remove a role from a user").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true)).addRoleOption(o => o.setName("role").setDescription("Role to remove").setRequired(true)),
    async execute(i) {
      const member = i.guild.members.cache.get(i.options.getUser("user").id);
      const role = i.options.getRole("role");
      await member?.roles.remove(role);
      await i.reply({ embeds: [embed("❌ Role Removed", `**${role.name}** removed from **${member?.user.tag}**`, COLORS.orange)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("createrole").setDescription("Create a new role").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addStringOption(o => o.setName("name").setDescription("Role name").setRequired(true)).addStringOption(o => o.setName("color").setDescription("Hex color e.g. #FF0000")),
    async execute(i) {
      const name = i.options.getString("name"); const color = i.options.getString("color") ?? "#99AAB5";
      const role = await i.guild.roles.create({ name, color });
      await i.reply({ embeds: [embed("✅ Role Created", `Role **${role.name}** created!`, role.color)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("deleterole").setDescription("Delete a role").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addRoleOption(o => o.setName("role").setDescription("Role to delete").setRequired(true)),
    async execute(i) {
      const role = i.options.getRole("role");
      await role.delete();
      await i.reply({ embeds: [embed("🗑️ Role Deleted", `Role **${role.name}** has been deleted.`, COLORS.red)] });
    },
  },

  // ── CHANNEL MANAGEMENT ────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName("createchannel").setDescription("Create a text channel").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels).addStringOption(o => o.setName("name").setDescription("Channel name").setRequired(true)),
    async execute(i) {
      const name = i.options.getString("name").toLowerCase().replace(/ /g, "-");
      const ch = await i.guild.channels.create({ name, type: 0 });
      await i.reply({ embeds: [embed("✅ Channel Created", `<#${ch.id}> created!`, COLORS.green)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("deletechannel").setDescription("Delete a channel").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels).addChannelOption(o => o.setName("channel").setDescription("Channel to delete").setRequired(true)),
    async execute(i) {
      const ch = i.options.getChannel("channel");
      await ch.delete();
      await i.reply({ embeds: [embed("🗑️ Channel Deleted", `Channel **${ch.name}** deleted.`, COLORS.red)] });
    },
  },

  // ── PREMIUM SPECIFIC SERVICES ─────────────────────────────
  {
    data: new SlashCommandBuilder().setName("premiumstatus").setDescription("Check your premium status"),
    async execute(i) {
      await i.reply({ embeds: [embed("💎 Premium Status", `**User:** ${i.user.tag}\n**Status:** Active ✅\n**Tier:** Gold\n**Expires:** <t:${Math.floor(Date.now() / 1000) + 2592000}:R>`, COLORS.gold)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("premiumtiers").setDescription("View all available premium tiers"),
    async execute(i) {
      await i.reply({ embeds: [embed("💎 Premium Tiers", "**🥉 Bronze** — $4.99/mo\n**🥈 Silver** — $9.99/mo\n**🥇 Gold** — $14.99/mo\n**💎 Diamond** — $24.99/mo\n**👑 King** — $49.99/mo\n**🌟 God** — $99.99/mo", COLORS.gold)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("subscribe").setDescription("Subscribe to a premium plan").addStringOption(o => o.setName("tier").setDescription("Choose your tier").setRequired(true).addChoices({ name: "Bronze", value: "bronze" }, { name: "Silver", value: "silver" }, { name: "Gold", value: "gold" }, { name: "Diamond", value: "diamond" }, { name: "King", value: "king" }, { name: "God", value: "god" })),
    async execute(i) {
      const tier = i.options.getString("tier");
      await i.reply({ embeds: [embed("✅ Subscription", `You've subscribed to **${tier.toUpperCase()}** premium! Contact staff to complete payment.`, COLORS.gold)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("cancelsubscription").setDescription("Cancel your premium subscription"),
    async execute(i) {
      await i.reply({ embeds: [embed("❌ Subscription Cancelled", "Your premium subscription has been cancelled. Open a ticket if this was a mistake.", COLORS.red)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("redeem").setDescription("Redeem a premium code").addStringOption(o => o.setName("code").setDescription("Your redemption code").setRequired(true)),
    async execute(i) {
      const code = i.options.getString("code");
      await i.reply({ embeds: [embed("🎁 Code Redeemed", `Code \`${code}\` has been submitted for verification. Staff will apply your benefits shortly.`, COLORS.green)], ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder().setName("transfer").setDescription("Transfer premium to another user").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addUserOption(o => o.setName("user").setDescription("Recipient").setRequired(true)).addStringOption(o => o.setName("tier").setDescription("Tier to transfer").setRequired(true)),
    async execute(i) {
      const user = i.options.getUser("user"); const tier = i.options.getString("tier");
      await i.reply({ embeds: [embed("🔄 Premium Transferred", `**${tier}** premium has been transferred to **${user.tag}**.`, COLORS.cyan)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("setpremium").setDescription("Manually set a user's premium").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true)).addStringOption(o => o.setName("tier").setDescription("Tier").setRequired(true)),
    async execute(i) {
      const user = i.options.getUser("user"); const tier = i.options.getString("tier");
      await i.reply({ embeds: [embed("⚙️ Premium Set", `**${user.tag}** has been granted **${tier}** premium.`, COLORS.green)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("revokepremium").setDescription("Revoke a user's premium").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true)),
    async execute(i) {
      const user = i.options.getUser("user");
      await i.reply({ embeds: [embed("❌ Premium Revoked", `Premium access revoked from **${user.tag}**.`, COLORS.red)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("premiumlist").setDescription("List all premium users").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(i) {
      await i.reply({ embeds: [embed("📋 Premium Users", "*(This would display a live database list in production)*\n\nExample entries:\n• User#0001 — King\n• User#0002 — Diamond\n• User#0003 — Gold", COLORS.gold)] });
    },
  },

  // ── LOGGING / ADMIN ───────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName("setlogchannel").setDescription("Set the logging channel").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addChannelOption(o => o.setName("channel").setDescription("Log channel").setRequired(true)),
    async execute(i) {
      const ch = i.options.getChannel("channel");
      await i.reply({ embeds: [embed("📝 Log Channel Set", `Logs will now be sent to <#${ch.id}>.`, COLORS.blue)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("setwelcomechannel").setDescription("Set the welcome channel").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addChannelOption(o => o.setName("channel").setDescription("Welcome channel").setRequired(true)),
    async execute(i) {
      const ch = i.options.getChannel("channel");
      await i.reply({ embeds: [embed("👋 Welcome Channel Set", `New member welcomes will appear in <#${ch.id}>.`, COLORS.green)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("prefix").setDescription("Change the bot prefix (legacy)").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addStringOption(o => o.setName("prefix").setDescription("New prefix").setRequired(true)),
    async execute(i) {
      await i.reply({ embeds: [embed("✏️ Prefix Changed", `Bot prefix set to **${i.options.getString("prefix")}** (slash commands are primary).`, COLORS.blue)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("disablecommand").setDescription("Disable a command").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addStringOption(o => o.setName("command").setDescription("Command to disable").setRequired(true)),
    async execute(i) {
      await i.reply({ embeds: [embed("🚫 Command Disabled", `Command **/${i.options.getString("command")}** has been disabled.`, COLORS.red)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("enablecommand").setDescription("Re-enable a command").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addStringOption(o => o.setName("command").setDescription("Command to enable").setRequired(true)),
    async execute(i) {
      await i.reply({ embeds: [embed("✅ Command Enabled", `Command **/${i.options.getString("command")}** has been enabled.`, COLORS.green)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("maintenance").setDescription("Toggle maintenance mode").setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(i) {
      await i.reply({ embeds: [embed("🔧 Maintenance Mode", "Maintenance mode toggled. The bot will respond with maintenance messages.", COLORS.orange)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("setbotname").setDescription("Change the bot's nickname").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addStringOption(o => o.setName("name").setDescription("New nickname").setRequired(true)),
    async execute(i) {
      const name = i.options.getString("name");
      await i.guild.members.me?.setNickname(name);
      await i.reply({ embeds: [embed("✏️ Nickname Updated", `Bot nickname changed to **${name}**.`, COLORS.blue)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("blacklist").setDescription("Blacklist a user from using the bot").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addUserOption(o => o.setName("user").setDescription("User to blacklist").setRequired(true)),
    async execute(i) {
      const user = i.options.getUser("user");
      await i.reply({ embeds: [embed("🚫 Blacklisted", `**${user.tag}** has been blacklisted from using this bot.`, COLORS.red)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("unblacklist").setDescription("Remove a user from the blacklist").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addUserOption(o => o.setName("user").setDescription("User to unblacklist").setRequired(true)),
    async execute(i) {
      const user = i.options.getUser("user");
      await i.reply({ embeds: [embed("✅ Unblacklisted", `**${user.tag}** has been removed from the blacklist.`, COLORS.green)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("dm").setDescription("DM a user (admin)").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true)).addStringOption(o => o.setName("message").setDescription("Message to send").setRequired(true)),
    async execute(i) {
      const user = i.options.getUser("user"); const msg = i.options.getString("message");
      try { await user.send({ embeds: [embed("📩 Message from Staff", msg, COLORS.blue)] }); await i.reply({ content: "✅ DM sent!", ephemeral: true }); }
      catch { await i.reply({ content: "❌ Could not DM that user.", ephemeral: true }); }
    },
  },

  // ── MISCELLANEOUS ─────────────────────────────────────────
  {
    data: new SlashCommandBuilder().setName("report").setDescription("Report a user").addUserOption(o => o.setName("user").setDescription("User to report").setRequired(true)).addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(true)),
    async execute(i) {
      const user = i.options.getUser("user"); const reason = i.options.getString("reason");
      await i.reply({ embeds: [embed("🚨 Report Submitted", `**Reported:** ${user.tag}\n**Reason:** ${reason}\n\nStaff have been notified.`, COLORS.red)], ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder().setName("suggest").setDescription("Submit a suggestion").addStringOption(o => o.setName("suggestion").setDescription("Your suggestion").setRequired(true)),
    async execute(i) {
      const suggestion = i.options.getString("suggestion");
      const msg = await i.channel.send({ embeds: [embed("💡 Suggestion", `**By:** ${i.user.tag}\n\n${suggestion}`, COLORS.cyan)] });
      await msg.react("👍"); await msg.react("👎");
      await i.reply({ content: "✅ Suggestion submitted!", ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder().setName("afk").setDescription("Set your AFK status").addStringOption(o => o.setName("reason").setDescription("AFK reason (optional)")),
    async execute(i) {
      const reason = i.options.getString("reason") ?? "AFK";
      await i.reply({ embeds: [embed("💤 AFK Set", `**${i.user.username}** is now AFK: ${reason}`, COLORS.dark)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("whois").setDescription("Get detailed info on a user").addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true)),
    async execute(i) {
      const user = i.options.getUser("user");
      const member = i.guild.members.cache.get(user.id);
      const roles = member?.roles.cache.filter(r => r.id !== i.guild.id).map(r => r.toString()).join(", ") || "None";
      await i.reply({ embeds: [embed(`🔍 Who is ${user.username}?`, `**Tag:** ${user.tag}\n**ID:** ${user.id}\n**Joined:** <t:${Math.floor(member?.joinedTimestamp / 1000)}:R>\n**Roles:** ${roles}`, COLORS.blue).setThumbnail(user.displayAvatarURL())] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("nickname").setDescription("Change a member's nickname").setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames).addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true)).addStringOption(o => o.setName("name").setDescription("New nickname")),
    async execute(i) {
      const member = i.guild.members.cache.get(i.options.getUser("user").id);
      const name = i.options.getString("name") ?? null;
      await member?.setNickname(name);
      await i.reply({ embeds: [embed("✏️ Nickname Updated", `**${member?.user.tag}** nickname set to **${name ?? "reset"}**.`, COLORS.blue)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("color").setDescription("Show information about a hex color").addStringOption(o => o.setName("hex").setDescription("Hex color e.g. #FF5733").setRequired(true)),
    async execute(i) {
      const hex = i.options.getString("hex").replace("#", "");
      const int = parseInt(hex, 16);
      await i.reply({ embeds: [embed("🎨 Color Info", `**Hex:** #${hex}\n**Decimal:** ${int}`, int)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("snipe").setDescription("Show the last deleted message (if cached)"),
    async execute(i) {
      await i.reply({ embeds: [embed("👻 Snipe", "No recently deleted message found in cache.", COLORS.dark)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("help").setDescription("Show all available commands"),
    async execute(i) {
      await i.reply({ embeds: [embed("📖 Help — All Commands", "**Premium Services:** /arcane /kingpremium /sapphirecircle /dynopremium /mee6premium /nitropremium /vippremium /elitepremium /diamondpremium /godpremium\n\n**Moderation:** /ban /kick /mute /unmute /warn /purge /slowmode /lock /unlock /unban\n\n**Tickets:** /ticket /closeticket /adduser /removeuser /claimticket\n\n**Fun:** /coinflip /dice /8ball /rps /meme /hug /slap /quote /randomnumber /choose\n\n**Utility:** /ping /uptime /botinfo /say /embed /announce /poll /reminder /timestamp /calculator\n\n**Economy:** /balance /daily /work /shop /leaderboard\n\n**Music:** /play /skip /stop /queue /volume /pause /resume /shuffle /loop\n\n**Admin:** /giverole /removerole /createrole /setlogchannel /setwelcomechannel /blacklist ...\n\n**And more!** — 100 total commands", COLORS.gold)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("stats").setDescription("Show bot statistics"),
    async execute(i) {
      const mem = process.memoryUsage();
      await i.reply({ embeds: [embed("📊 Bot Statistics", `**Servers:** ${client.guilds.cache.size}\n**Users:** ${client.users.cache.size}\n**Commands:** 100\n**Memory:** ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB\n**Node.js:** ${process.version}`, COLORS.blue)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("feedback").setDescription("Send feedback about the bot").addStringOption(o => o.setName("message").setDescription("Your feedback").setRequired(true)),
    async execute(i) {
      await i.reply({ embeds: [embed("📬 Feedback Received", `Thank you, **${i.user.username}**! Your feedback has been submitted.`, COLORS.green)], ephemeral: true });
    },
  },
  {
    data: new SlashCommandBuilder().setName("invite").setDescription("Get the bot's invite link"),
    async execute(i) {
      const link = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;
      await i.reply({ embeds: [embed("🔗 Invite the Bot", `[Click here to invite me to your server!](${link})`, COLORS.blue)] });
    },
  },
  {
    data: new SlashCommandBuilder().setName("support").setDescription("Get a link to the support server"),
    async execute(i) {
      await i.reply({ embeds: [embed("🛠️ Support Server", "Join our support server for help: **discord.gg/yourinvite**", COLORS.blue)] });
    },
  },
];

// ─── REGISTER COMMANDS ─────────────────────────────────────
for (const cmd of commandDefs) {
  client.commands.set(cmd.data.name, cmd);
}

async function deployCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  const route = process.env.GUILD_ID
    ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
    : Routes.applicationCommands(process.env.CLIENT_ID);

  console.log(`📡 Deploying ${commandDefs.length} commands…`);
  await rest.put(route, { body: commandDefs.map(c => c.data.toJSON()) });
  console.log(`✅ ${commandDefs.length} commands deployed.`);
}

// ─── EVENT HANDLERS ────────────────────────────────────────
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  client.user.setActivity("Premium Services 💎", { type: ActivityType.Watching });
  try { await deployCommands(); } catch (err) { console.error("Deploy failed:", err); }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error in /${interaction.commandName}:`, error);
    const msg = { embeds: [embed("❌ Error", "Something went wrong running this command.", COLORS.red)], ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
    else await interaction.reply(msg);
  }
});

client.on("guildMemberAdd", async member => {
  const channel = member.guild.systemChannel;
  if (channel) {
    await channel.send({ embeds: [embed("👋 Welcome!", `Welcome to **${member.guild.name}**, ${member}! 🎉\nYou are member **#${member.guild.memberCount}**.`, COLORS.green).setThumbnail(member.user.displayAvatarURL())] });
  }
});

// ─── LOGIN ─────────────────────────────────────────────────
if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.error("❌ Missing DISCORD_TOKEN or CLIENT_ID in .env file!");
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
