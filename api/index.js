const express = require('express');
const cors = require('cors');
const animefire = require('./providers/animefire');
const animesonline = require('./providers/animesonline');

const app = express();
app.use(cors());

/**
 * SEGURANÇA: AUTO-EXECUÇÃO DE LIMPEZA
 * Se o processo pai (Electron) desconectar ou morrer, a API fecha sozinha.
 */
process.on('disconnect', () => {
    console.log('[API] Pai desconectado. Encerrando...');
    process.exit();
});

process.on('SIGTERM', () => {
    console.log('[API] Recebido SIGTERM. Encerrando...');
    process.exit();
});

process.on('SIGINT', () => {
    console.log('[API] Recebido SIGINT (Ctrl+C). Encerrando...');
    process.exit();
});

// Rotas da API
app.get('/api/search', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    const cleanQuery = q.split(':')[0]
        .replace(/(\d+st|\d+nd|\d+rd|\d+th|Season\s+\d+|Season)/gi, '')
        .trim();

    const seasonMatch = q.match(/(\d+)(?:st|nd|rd|th)\s+Season|Season\s+(\d+)/i);
    const targetSeason = seasonMatch ? parseInt(seasonMatch[1] || seasonMatch[2]) : 1;

    try {
        const [resultsFire, resultsOnline] = await Promise.all([
            animefire.search(q).catch(() => []),
            animesonline.search(cleanQuery).catch(() => [])
        ]);

        let combined = [...resultsFire, ...resultsOnline];

        if (targetSeason > 1) {
            console.log(`[NextArc API] 🛡️ Filtrando Temporada ${targetSeason}...`);

            // 1. Tenta filtrar por número absoluto (ex: Frieren S2 começa no 29)
            let filtered = combined.filter(ep => {
                const epNum = parseInt(ep.title.replace(/\D/g, ''));
                return epNum > 28;
            });

            // 2. Se não achou nada acima de 28, talvez o site resetou a conta (Ep 01, 02...)
            if (filtered.length === 0) {
                filtered = combined.filter(ep =>
                    ep.title.toLowerCase().includes(`${targetSeason}ª`) ||
                    ep.title.toLowerCase().includes(`temp ${targetSeason}`) ||
                    ep.title.toLowerCase().includes(`s${targetSeason}`)
                );
            }

            // 3. ULTIMO RECURSO: Se ainda for 0, e sabemos que é Season 2, 
            // pegamos os últimos episódios da lista (os mais recentes)
            if (filtered.length === 0 && combined.length > 28) {
                console.log(`[NextArc API] ⚠️ Filtro falhou, pegando episódios recentes (Pós-28)`);
                filtered = combined.slice(28);
            }

            combined = filtered;
        } else if (targetSeason === 1) {
            // Se for Season 1, limita aos primeiros 28
            if (combined.length > 28) combined = combined.slice(0, 28);
        }

        console.log(`[NextArc API] ✅ Finalizado com ${combined.length} episódios.`);
        res.json(combined);

    } catch (error) {
        console.error(`[API Search Error]:`, error);
        res.status(500).json([]);
    }
});

app.get('/api/video', async (req, res) => {
    const { url, provider } = req.query;
    if (!url) return res.status(400).json({ error: "URL não fornecida" });

    console.log(`[NextArc API] 🎥 Extraindo vídeo de: ${url} (${provider})`);

    try {
        let videoUrl = null;

        if (provider === 'AnimeFire') {
            videoUrl = await animefire.extractVideo(url);
        } else if (provider === 'AnimesOnline') {
            videoUrl = await animesonline.extractVideo(url);
        }

        if (videoUrl) {
            console.log(`[NextArc API] ✅ Vídeo encontrado: ${videoUrl.substring(0, 50)}...`);
            return res.json({ url: videoUrl });
        }

        res.status(404).json({ error: "Não foi possível extrair o vídeo." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3000;
const server = app.listen(PORT, () => {
    console.log(`🚀 API NextArc rodando na porta ${PORT}`);
});

// Em caso de erro fatal no servidor Express
server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`[API Fatal]: A porta ${PORT} já está em uso! Tentando fechar instâncias fantasmas...`);
        process.exit(1);
    }
});