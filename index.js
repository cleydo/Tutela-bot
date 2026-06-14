const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const Parser = require('rss-parser');

const app = express();
app.get('/', (req, res) => res.send('Bot vivo'));
// Aseguramos que Render pueda usar su propio puerto
app.listen(process.env.PORT || 3000); 

// Disfrazamos al bot como un navegador Chrome normal para evitar que lo bloqueen
const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
});

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
            // Usamos xcancel, una instancia resistente a bloqueos
            const rssUrl = `https://xcancel.com/${cuenta.twitterUser}/rss`;
            const feed = await parser.parseURL(rssUrl);
            
            if (!feed.items || feed.items.length === 0) continue;
            
            const ultimoTweet = feed.items[0];
            
            // Reconvertimos el link a formato de Twitter para enviarlo al canal
            const linkOriginal = ultimoTweet.link.replace('xcancel.com', 'twitter.com');
            const tweetId = linkOriginal;

            if (!historialTweets[cuenta.twitterUser]) {
                historialTweets[cuenta.twitterUser] = tweetId;
                console.log(`Primer tweet registrado en memoria para: ${cuenta.twitterUser}`);
                continue;
            }

            if (historialTweets[cuenta.twitterUser] !== tweetId) {
                historialTweets[cuenta.twitterUser] = tweetId;
                const canal = await client.channels.fetch(cuenta.discordChannelId);
                if (canal) await canal.send(`📢 **Nuevo tweet de @${cuenta.twitterUser}:**\n${linkOriginal}`);
                console.log(`¡Tweet de ${cuenta.twitterUser} enviado al canal!`);
            }
        } catch (e) { 
            // Ahora si falla, te dirá exactamente la causa técnica en los logs
            console.log(`Error con ${cuenta.twitterUser}: ${e.message}`); 
        }
    }
}

client.login(process.env.DISCORD_TOKEN);
