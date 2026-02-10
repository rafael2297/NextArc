// api/providers/animefire.js
const axios = require('axios');
const cheerio = require('cheerio');

async function search(query) {
    try {
        const slug = query.toLowerCase().normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "")
            .trim().replace(/\s+/g, '-');

        const url = `https://animefire.io/animes/${slug}-todos-os-episodios`;

        // Headers mais robustos
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            timeout: 5000
        });

        const $ = cheerio.load(response.data);
        const episodes = [];

        $('.divPaginaEpisodios a').each((i, el) => {
            episodes.push({
                title: $(el).text().trim(),
                link: $(el).attr('href'),
                provider: 'AnimeFire',
                img: 'https://cdn.statically.io/gh/AnimeFire/assets/main/icon.png' // Ícone padrão se não tiver img
            });
        });

        return episodes.reverse();
    } catch (e) {
        return [];
    }
}

async function extractVideo(pageUrl) {
    try {
        const { data } = await axios.get(pageUrl);
        const $ = cheerio.load(data);
        
        // O AnimeFire costuma colocar o link do vídeo em um script ou iframe
        // Tentativa de pegar o vídeo direto do player deles
        const videoElement = $('#video-player, video, iframe').first();
        let videoSrc = videoElement.attr('src') || videoElement.find('source').attr('src');

        if (!videoSrc) {
            // Fallback: busca por links .mp4 ou m3u8 no texto da página
            const match = data.match(/file":\s*"([^"]+)"/);
            if (match) videoSrc = match[1].replace(/\\/g, '');
        }

        return videoSrc;
    } catch (e) { return null; }
}


module.exports = { search, extractVideo };
