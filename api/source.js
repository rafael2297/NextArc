const express = require('express');
const cors = require('cors');

const animefire = require('./providers/animefire');
const animesonline = require('./providers/animesonline');

const app = express();
app.use(cors());

/* =======================
   🛡️ SEGURANÇA E AUTO-SUICÍDIO
======================= */
// Se o processo pai (Electron) desconectar, a API morre sozinha
process.on('disconnect', () => {
    console.log('[API] Pai desconectado. Encerrando...');
    process.exit();
});

process.on('SIGINT', () => process.exit());
process.on('SIGTERM', () => process.exit());

// Prevenção contra travamentos (Auto-Kill órfão)
// Se por algum motivo o Electron fechar e não matar a API, 
// este check ajuda a encerrar o processo.
setInterval(() => {
    if (process.stdout && !process.stdout.writable) {
        process.exit();
    }
}, 30000);

/* =======================
   FUNÇÃO CENTRAL
======================= */
async function searchAll(q) {
    const providers = [
        { name: 'AnimeFire', api: animefire },
        { name: 'AnimesOnline', api: animesonline }
    ];

    const allEpisodes = [];

    for (const p of providers) {
        try {
            console.log(`[API] Buscando "${q}" em ${p.name}...`);
            const seasons = await p.api.search(q);

            if (!Array.isArray(seasons)) {
                console.log(`[API] Provider ${p.name} não retornou array.`);
                continue;
            }

            seasons.forEach(s => {
                const seasonNum = s.season || 1;
                if (s.episodes && Array.isArray(s.episodes)) {
                    s.episodes.forEach(ep => {
                        allEpisodes.push({
                            title: ep.title,
                            link: ep.link,
                            img: ep.img || 'https://via.placeholder.com/150',
                            provider: p.name,
                            season: seasonNum
                        });
                    });
                }
            });
        } catch (e) {
            console.error(`[API] Erro no provider ${p.name}:`, e.message);
        }
    }
    return allEpisodes;
}

/* =======================
   🎥 1. ROTA DE VÍDEO
======================= */
app.get('/api/video', async (req, res) => {
    const { url, provider } = req.query;
    console.log(`[VIDEO] 🎬 Request para: ${provider} | URL: ${url}`);

    if (!url || !provider) {
        return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    try {
        let videoUrl = null;
        if (provider === 'AnimeFire') {
            videoUrl = await animefire.extractVideo(url);
        } else if (provider === 'AnimesOnline') {
            videoUrl = await animesonline.extractVideo(url);
        }

        if (videoUrl) {
            console.log(`[VIDEO] ✅ Sucesso!`);
            return res.json({ url: videoUrl });
        }

        console.log(`[VIDEO] ❌ Falha na extração`);
        return res.status(404).json({ url: null, error: 'Vídeo não encontrado' });
    } catch (e) {
        console.error(`[VIDEO] 🚨 Erro:`, e.message);
        return res.status(500).json({ error: e.message });
    }
});

/* =======================
   🔎 2. ROTA DE BUSCA
======================= */
app.get('/api/search', async (req, res) => {
    let q = req.query.q;

    if (!q) return res.json([]);

    // 1. EXTRAÇÃO INTELIGENTE: Se o nome vier como "[Oshi no Ko] 3rd Season"
    // tentamos pegar apenas o que está dentro dos colchetes.
    const matchColchetes = q.match(/\[(.*?)\]/);
    if (matchColchetes && matchColchetes[1]) {
        q = matchColchetes[1];
    }

    // 2. LIMPEZA ADICIONAL: Remove termos técnicos de temporada que sobraram
    const cleanQuery = q
        .replace(/(\d+st|\d+nd|\d+rd|\d+th|season\s+\d+|season|temporada\s+\d+|parte\s+\d+|part\s+\d+)/gi, '')
        .trim();

    console.log(`[SEARCH] 🔍 Buscando por: "${cleanQuery}" (Query original: "${req.query.q}")`);

    try {
        // Passamos a query limpa para o searchAll
        const episodes = await searchAll(cleanQuery);

        console.log(`[SEARCH] ✅ Retornando ${episodes.length} episódios para "${cleanQuery}"`);
        return res.json(episodes);
    } catch (e) {
        console.error(`[SEARCH] 🚨 Erro:`, e.message);
        return res.status(500).json([]);
    }
});

/* =======================
   🔥 3. ROTA DE LANÇAMENTOS
======================= */
app.get('/api/episodes', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    try {
        console.log(`[RECENT] 🕒 Pagina: ${page}`);
        const episodes = await animesonline.getRecentEpisodes(page);
        res.json(episodes);
    } catch (e) {
        console.error(`[RECENT] 🚨 Erro:`, e.message);
        res.status(500).json([]);
    }
});

/* =======================
   🚀 START
======================= */
const PORT = 3000;
app.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 NextArc API online na porta ${PORT}`);
});