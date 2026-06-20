require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once('ready', () => {
  console.log(`Bot connecté: ${client.user.tag}`);
});

client.on('messageCreate', message => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!')) return;
  const args = message.content.slice(1).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  if (cmd === 'ping') message.reply('🏓 Pong!');
  if (cmd === 'help') message.reply('Commandes: !ping, !help');
});

client.login(process.env.DISCORD_TOKEN);
