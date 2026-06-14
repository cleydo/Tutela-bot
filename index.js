const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const Parser = require('rss-parser');

// 1. Mantenemos el servidor web para que UptimeRobot esté feliz
const app = express();
app.get('/', (req, res) => res.send('Bot vivo'));
app.listen(process.env.PORT || 3000); 

// 2. Disfrazamos al bot
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
        
        // SISTEMA ANTI-CAÍDAS: Lista de servidores alternativos
        const servidoresRSS = [
            `https://nitter.poast.org/${cuenta.twitterUser}/rss`,
            `https://nitter.privacydev.net/${cuenta.twitterUser}/rss`,
            `https://rsshub.app/twitter/user/${cuenta.twitterUser}`
        ];

        let feed = null;

        // El bot probará uno por uno hasta que uno funcione
        for (const url of servidoresRSS) {
            try {
                feed = await parser.parseURL(url);
                break; // ¡Funcionó! Rompemos el ciclo y dejamos de intentar
            } catch (e) {
                // Si falla, no hace ruido, simplemente pasa al siguiente enlace
                continue; 
            }
        }

        // Si después de intentar con todos, ninguno funcionó:
        if (!feed || !feed.items || feed.items.length === 0) {
            console.log(`Twitter bloqueó la lectura de ${cuenta.twitterUser} en este turno (Reintentará en 10 min).`);
            continue;
        }

        const ultimoTweet = feed.items[0];
        
        // Limpiamos el link sin importar de qué servidor vino
        const linkOriginal = ultimoTweet.link.replace(/(nitter\.poast\.org|nitter\.privacydev\.net|rsshub\.app\/twitter\/user)/g, 'twitter.com');
        const tweetId = linkOriginal;

        if (!historialTweets[cuenta.twitterUser]) {
            historialTweets[cuenta.twitterUser] = tweetId;
            console.log(`Primer tweet registrado en memoria para: ${cuenta.twitterUser}`);
            continue;
        }

        if (historialTweets[cuenta.twitterUser] !== tweetId) {
            historialTweets[cuenta.twitterUser] = tweetId;
            try {
                const canal = await client.channels.fetch(cuenta.discordChannelId);
                if (canal) await canal.send(`📢 **Nuevo tweet de @${cuenta.twitterUser}:**\n${linkOriginal}`);
                console.log(`¡Tweet de ${cuenta.twitterUser} enviado al canal!`);
            } catch (err) {
                console.log(`Fallo al enviar mensaje a Discord.`);
            }
        }
    }
}

client.login(process.env.DISCORD_TOKEN);
