const axios = require('axios');
const cheerio = require('cheerio');

const DEFAULT_IMG = 'https://m.media-amazon.com/images/I/71u9vN08Y6L._AC_UF894,1000_QL80_.jpg';

async function search(query) {
    try {
        // 1. LIMPEZA PARA URL SLUG (ex: "Oshi no Ko" -> "oshi-no-ko")
        const cleanSlug = query
            .replace(/\[|\]/g, '')
            .split(':')[0]
            .split('-')[0]
            .replace(/(\d+st|\d+nd|\d+rd|\d+th|season|temporada|parte|part)/gi, '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-'); // Transforma espaços em hifens

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://animesonlinecc.to/'
        };

        // ESTRATÉGIA: Tentar o link direto primeiro (é mais rápido e pula o erro da busca)
        const directLink = `https://animesonlinecc.to/anime/${cleanSlug}/`;
        console.log(`[AnimesOnline] 🚀 Tentando acesso direto: ${directLink}`);

        let response;
        try {
            response = await axios.get(directLink, { headers });
        } catch (e) {
            console.log(`[AnimesOnline] ⚠️ Link direto falhou, tentando busca via query...`);
            // Se o link direto falhar (404), tentamos a busca por parâmetro oficial
            const searchUrl = `https://animesonlinecc.to/?s=${cleanSlug.replace(/-/g, '+')}`;
            response = await axios.get(searchUrl, { headers });
        }

        const $ = cheerio.load(response.data);

        // Se caímos na página de busca, precisamos pegar o primeiro link
        let animePageHtml = response.data;
        if (response.config.url.includes('?s=')) {
            const firstResult = $('.result-item article .details .title a').first().attr('href') ||
                $('article a').first().attr('href');

            if (firstResult) {
                const secondResponse = await axios.get(firstResult, { headers });
                animePageHtml = secondResponse.data;
            } else {
                return [];
            }
        }

        const $$ = cheerio.load(animePageHtml);
        const seasonsResult = [];

        // 2. EXTRAÇÃO (Usando o HTML que você confirmou)
        $$('.se-c').each((i, element) => {
            const seasonNumber = parseInt($$(element).find('.se-t').text().trim()) || (i + 1);
            const episodesInSeason = [];

            $$(element).find('ul.episodios li').each((__, li) => {
                const aTag = $$(li).find('.episodiotitle a');
                const link = aTag.attr('href');
                const title = aTag.text().trim();
                const epNum = $$(li).find('.numerando').text().trim();

                let img = $$(li).find('img').attr('src') || '';
                if (img.startsWith('//')) img = 'https:' + img;

                if (link) {
                    episodesInSeason.push({
                        title: `${epNum} ${title}`,
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
                    episodes: episodesInSeason
                });
            }
        });

        console.log(`[AnimesOnline] ✨ Sucesso! Encontradas ${seasonsResult.length} temporadas.`);
        return seasonsResult;

    } catch (error) {
        console.error('[AnimesOnline] ❌ Erro crítico:', error.message);
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