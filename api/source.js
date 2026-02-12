const express = require('express')
const cors = require('cors')

const animefire = require('./providers/animefire')
const animesonline = require('./providers/animesonline')

const app = express()
app.use(cors())

/* =======================
   SEGURANÇA (Electron)
======================= */
process.on('disconnect', () => process.exit())
process.on('SIGINT', () => process.exit())
process.on('SIGTERM', () => process.exit())

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
            const seasons = await p.api.search(q);
            if (!Array.isArray(seasons)) continue;

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
            console.error(`Erro no provider ${p.name}:`, e.message);
        }
    }
    return allEpisodes;
}

/* =======================
   🎥 1. ROTA DE VÍDEO (PRIORIDADE)
======================= */
app.get('/api/video', async (req, res) => {
    const { url, provider } = req.query;
    console.log(`[VIDEO] 🎬 Request para: ${provider}`);

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
            console.log(`[VIDEO] ✅ URL extraída`);
            return res.json({ url: videoUrl });
        }

        console.log(`[VIDEO] ❌ Link não encontrado`);
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
    const q = req.query.q;
    console.log(`[SEARCH] 🔍 Buscando por: ${q}`);

    if (!q) return res.json([]);

    try {
        const episodes = await searchAll(q);
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
        const episodes = await animesonline.getRecentEpisodes(page);
        res.json(episodes);
    } catch (e) {
        res.status(500).json([]);
    }
});
/* =======================
   START
======================= */
const PORT = 3000
app.listen(PORT, () => {
    console.log(`🚀 NextArc API rodando em http://127.0.0.1:${PORT}`)
    console.log(`-- Rota de vídeo: /api/video`)
    console.log(`-- Rota de busca: /api/search`)
})