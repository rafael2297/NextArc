const axios = require('axios');
const cheerio = require('cheerio');

async function search(query) {
    try {
        // Limpeza radical para a busca: remove termos de temporada que o buscador deles não entende
        const cleanName = query.split(':')[0]
            .replace(/(\d+st|\d+nd|\d+rd|\d+th|Season\s+\d+|Season|Temporada\s+\d+|Part\s+\d+)/gi, '')
            .trim();

        const searchUrl = `https://animesonlinecc.to/search/${encodeURIComponent(cleanName)}`;

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': 'https://animesonlinecc.to/',
            'Cache-Control': 'no-cache'
        };

        console.log(`[AnimesOnline] Pesquisando: ${cleanName}`);

        const searchResponse = await axios.get(searchUrl, { headers, timeout: 10000 });
        const $ = cheerio.load(searchResponse.data);

        // Tenta pegar o link do primeiro resultado da busca
        const animeLink = $('.result-item article a').first().attr('href') || $('.item a').first().attr('href');

        if (!animeLink) {
            console.log(`[AnimesOnline] Nenhum link de anime encontrado para: ${cleanName}`);
            return [];
        }

        console.log(`[AnimesOnline] Acessando página do anime: ${animeLink}`);

        const animePage = await axios.get(animeLink, { headers, timeout: 10000 });
        const $$ = cheerio.load(animePage.data);
        const episodes = [];

        // O AnimesOnline organiza episódios em várias estruturas possíveis (ul.episodios ou div.se-c)
        const selectors = [
            '.episodios li',
            '.se-c li',
            '.list-episodios li',
            '#single_rel_ep li'
        ];

        selectors.forEach(selector => {
            $$(selector).each((i, el) => {
                const link = $$(el).find('a').attr('href');
                let title = $$(el).find('.episodiotitle a').text().trim() ||
                    $$(el).find('.ep-title').text().trim() ||
                    $$(el).find('a').text().trim();

                // Evita pegar links que não sejam de episódios (como trailers ou extras)
                if (link && link.includes('/episodio/')) {
                    // Limpeza básica do título (ex: remove "Assistir " do início)
                    title = title.replace(/^Assistir\s+/i, '');

                    episodes.push({
                        title: title || `Episódio ${i + 1}`,
                        link: link,
                        provider: 'AnimesOnline',
                        img: 'https://m.media-amazon.com/images/I/71u9vN08Y6L._AC_UF894,1000_QL80_.jpg'
                    });
                }
            });
        });

        // Se encontrou episódios em múltiplos seletores, remove duplicatas por link
        const uniqueEpisodes = Array.from(new Map(episodes.map(item => [item.link, item])).values());

        console.log(`[AnimesOnline] ✅ ${uniqueEpisodes.length} episódios extraídos.`);
        return uniqueEpisodes;

    } catch (error) {
        console.error(`[AnimesOnline] Erro detalhado: ${error.message}`);
        return [];
    }
}

async function extractVideo(pageUrl) {
    try {
        const { data } = await axios.get(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(data);

        // No AnimesOnline, o vídeo geralmente está dentro de um iframe com a classe 'video-iframe'
        // ou dentro de um elemento que carrega o player
        let playerUrl = $('iframe').first().attr('src') ||
            $('.video-content iframe').attr('src') ||
            $('#player_embed iframe').attr('src');

        // Se o link for relativo (começar com //), adiciona o https:
        if (playerUrl && playerUrl.startsWith('//')) {
            playerUrl = 'https:' + playerUrl;
        }

        return playerUrl;
    } catch (e) { return null; }
}

module.exports = { search, extractVideo };