const axios = require('axios');
const cheerio = require('cheerio');

const DEFAULT_IMG = 'https://m.media-amazon.com/images/I/71u9vN08Y6L._AC_UF894,1000_QL80_.jpg';

async function search(query) {
    try {
        // Limpa o nome para busca
        const cleanName = query
            .split(':')[0]
            .replace(/(\d+st|\d+nd|\d+rd|\d+th|season\s+\d+|season|temporada\s+\d+|parte\s+\d+|part\s+\d+)/gi, '')
            .trim();

        const searchUrl = `https://animesonlinecc.to/search/${encodeURIComponent(cleanName)}`;
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'pt-BR,pt;q=0.9'
        };

        console.log(`[AnimesOnline] 🔍 Pesquisando: ${cleanName}`);

        const searchResponse = await axios.get(searchUrl, { headers });
        const $ = cheerio.load(searchResponse.data);

        const animeLink = $('.result-item article a').first().attr('href') || $('.item a').first().attr('href');

        if (!animeLink) {
            console.log('[AnimesOnline] ❌ Nenhum resultado encontrado');
            return [];
        }

        console.log(`[AnimesOnline] 📄 Página do anime: ${animeLink}`);
        const animePage = await axios.get(animeLink, { headers });
        const $$ = cheerio.load(animePage.data);

        const seasonsResult = [];

        /**
         * 🚀 NOVA LÓGICA: Percorre as DIVS de temporada (.se-c)
         * O site organiza como:
         * <div class="se-c">
         * <span class="title">Temporada 1</span>
         * <ul class="episodios">...</ul>
         * </div>
         */
        $$('.se-c').each((_, element) => {
            const seasonTitleText = $$(element).find('.se-q .title').text().trim();
            // Extrai apenas o número do texto "Temporada 1"
            const seasonNumber = parseInt(seasonTitleText.replace(/\D/g, '')) || (seasonsResult.length + 1);

            const episodesInSeason = [];

            $$(element).find('ul.episodios li').each((__, li) => {
                const link = $$(li).find('a').first().attr('href');
                const title = $$(li).find('.episodiotitle a').text().trim() || $$(li).find('.numerando').text().trim();
                const img = $$(li).find('img').attr('src') || DEFAULT_IMG;

                if (link && link.includes('/episodio/')) {
                    episodesInSeason.push({
                        title: title,
                        link: link,
                        img: img,
                        provider: 'AnimesOnline',
                        season: seasonNumber
                    });
                }
            });

            if (episodesInSeason.length > 0) {
                seasonsResult.push({
                    season: seasonNumber,
                    title: `Temporada ${seasonNumber}`,
                    episodes: episodesInSeason.sort((a, b) => {
                        const na = parseInt(a.title.replace(/\D/g, '')) || 0;
                        const nb = parseInt(b.title.replace(/\D/g, '')) || 0;
                        return na - nb;
                    })
                });
            }
        });

        // Caso o site mude a estrutura e não encontre nada nas .se-c, tenta o fallback
        if (seasonsResult.length === 0) {
            console.warn('[AnimesOnline] ⚠️ Estrutura .se-c não encontrada, usando fallback simples');
            const fallbackEpisodes = [];
            $$('ul.episodios li, .list-episodios li').each((_, li) => {
                const link = $$(li).find('a').attr('href');
                const title = $$(li).text().trim();
                if (link && link.includes('/episodio/')) {
                    fallbackEpisodes.push({
                        title,
                        link,
                        img: DEFAULT_IMG,
                        provider: 'AnimesOnline',
                        season: 1
                    });
                }
            });

            if (fallbackEpisodes.length > 0) {
                seasonsResult.push({
                    season: 1,
                    title: 'Temporada 1',
                    episodes: fallbackEpisodes
                });
            }
        }

        console.log(`[AnimesOnline] ✅ ${seasonsResult.length} temporadas detectadas`);
        return seasonsResult.sort((a, b) => a.season - b.season);

    } catch (error) {
        console.error('[AnimesOnline] ❌ Erro:', error.message);
        return [];
    }
}

async function extractVideo(pageUrl) {
    try {
        const { data } = await axios.get(pageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://animesonlinecc.to/'
            },
            timeout: 10000 // 10 segundos de limite
        });

        const $ = cheerio.load(data);

        // 1. Tenta pegar o iframe principal
        let playerUrl =
            $('#player_embed iframe').attr('src') ||
            $('.video-content iframe').attr('src') ||
            $('iframe[src*="player"]').attr('src') ||
            $('iframe[src*="vidsrc"]').attr('src') ||
            $('iframe').first().attr('src');

        // 2. Se não achou no iframe, tenta buscar por links de players externos em botões
        if (!playerUrl) {
            playerUrl = $('.dooplay_player_option').first().attr('data-url');
        }

        // 3. Se ainda não achou, tenta procurar no texto bruto (Regex) por links de embed
        if (!playerUrl) {
            const match = data.match(/iframe src="([^"]+)"/);
            if (match) playerUrl = match[1];
        }

        if (playerUrl && playerUrl.startsWith('//')) {
            playerUrl = 'https:' + playerUrl;
        }

        console.log(`[AnimesOnline] 🎬 Player encontrado: ${playerUrl}`);
        return playerUrl || null;
    } catch (error) {
        console.error(`[AnimesOnline] ❌ Erro na extração: ${error.message}`);
        return null;
    }
}

async function getRecentEpisodes(page = 1) {
    try {
        // Ajustado para a URL que você confirmou
        const url = page > 1
            ? `https://animesonlinecc.to/episodio/page/${page}/`
            : `https://animesonlinecc.to/episodio/`;

        console.log(`[AnimesOnline] 🌐 Scrapping: ${url}`);

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': 'https://animesonlinecc.to/'
            }
        });

        const $ = cheerio.load(data);
        const episodes = [];

        // SELETOR EXATO baseado no HTML que você mandou: <article class="item se episodes">
        $('article.item.se.episodes').each((_, el) => {
            const linkTag = $(el).find('.eptitle h3 a');
            const fullTitle = linkTag.text().trim(); // "Oshi no Ko 3 Episodio 5"
            const link = linkTag.attr('href'); // URL completa do episódio

            // Imagem dentro da div .poster
            const image = $(el).find('.poster img').attr('src');

            if (link && fullTitle) {
                // Regex para pegar o número do episódio no final da frase
                const epMatch = fullTitle.match(/Episodio\s+(\d+)/i);
                const episodeNumber = epMatch ? epMatch[1] : "??";

                // Limpa o título (remove "Episodio X")
                const animeTitle = fullTitle.replace(/Episodio\s+\d+/i, '').trim();

                // Extrai o ID para navegação
                // Ex: ".../episodio/oshi-no-ko-3-episodio-5/" -> "oshi-no-ko-3"
                const urlParts = link.split('/').filter(Boolean);
                const lastPart = urlParts[urlParts.length - 1];
                const animeId = lastPart.replace(/-episodio-\d+/i, '');

                episodes.push({
                    id: link,
                    title: animeTitle,
                    image: image,
                    episodeNumber: episodeNumber,
                    animeId: animeId
                });
            }
        });

        console.log(`[AnimesOnline] ✅ Sucesso! ${episodes.length} episódios capturados.`);
        return episodes;
    } catch (error) {
        console.error('[AnimesOnline] ❌ Erro no Scraping:', error.message);
        return [];
    }
}


module.exports = { search, extractVideo, getRecentEpisodes };