const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const Parser = require('rss-parser');

const app = express();
app.get('/', (req, res) => res.send('Bot vivo'));
app.listen(3000);

const parser = new Parser();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const MONITOREO = [
    { twitterUser: 'Sappurit', discordChannelId: '1515784440721178834' },
    { twitterUser: 'MadridistaaFC', discordChannelId: '1515784440721178834' },
    { twitterUser: 'HDWolvie', discordChannelId: '1515784440721178834' }
];

const TIEMPO_REVISION = 10 * 60 * 1000;
const historialTweets = {};

client.once('ready', () => {
    console.log(`Bot conectado como ${client.user.tag}`);
    revisarTweets();
    setInterval(revisarTweets, TIEMPO_REVISION);
});

async function revisarTweets() {
    for (const cuenta of MONITOREO) {
        try {
            const rssUrl = `https://rsshub.app/twitter/user/${cuenta.twitterUser}`;
            const feed = await parser.parseURL(rssUrl);
            if (!feed.items || feed.items.length === 0) continue;
            const ultimoTweet = feed.items[0];
            const tweetId = ultimoTweet.link;

            if (!historialTweets[cuenta.twitterUser]) {
                historialTweets[cuenta.twitterUser] = tweetId;
                continue;
            }

            if (historialTweets[cuenta.twitterUser] !== tweetId) {
                historialTweets[cuenta.twitterUser] = tweetId;
                const canal = await client.channels.fetch(cuenta.discordChannelId);
                if (canal) await canal.send(`📢 **Nuevo tweet de @${cuenta.twitterUser}:**\n${ultimoTweet.link}`);
            }
        } catch (e) { console.log(`Error con ${cuenta.twitterUser}`); }
    }
}

client.login(process.env.DISCORD_TOKEN);
