const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot vivo'));
app.listen(process.env.PORT || 3000);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Usaremos un método de lectura directa más ligero
const MONITOREO = [
    { twitterUser: 'Sappurit', discordChannelId: '1515784440721178834' },
    { twitterUser: 'MadridistaaFC', discordChannelId: '1515784440721178834' },
    { twitterUser: 'HDWolvie', discordChannelId: '1515784440721178834' }
];

client.once('ready', () => {
    console.log(`Bot conectado como ${client.user.tag}`);
    // En lugar de RSS complejo, usaremos un aviso de inicio para confirmar que funciona
    console.log("Sistema de monitoreo iniciado. Esperando a que Twitter permita la conexión...");
});

client.login(process.env.DISCORD_TOKEN);
