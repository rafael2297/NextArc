const axios = require('axios')
const cheerio = require('cheerio')

const BASE_URL = 'https://animefire.io'

function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
}

async function search(query) {
    try {
        const slug = slugify(query)

        // URL nova do AnimeFire
        const url = `${BASE_URL}/animes/${slug}`

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                Accept:
                    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 8000
        })

        const $ = cheerio.load(data)
        const episodes = []

        // 🔥 NOVO SELETOR FUNCIONAL
        $('.div_video_list a.lEp').each((_, el) => {
            const title = $(el).text().trim()
            const link = $(el).attr('href')

            if (!link) return

            episodes.push({
                title,
                link: link.startsWith('http')
                    ? link
                    : BASE_URL + link,
                provider: 'animefire',
                img:
                    'https://animefire.io/img/favicon.png'
            })
        })

        return episodes
    } catch (err) {
        console.error('[AnimeFire] search error:', err.message)
        return []
    }
}

async function extractVideo(pageUrl) {
    try {
        const { data } = await axios.get(pageUrl, {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        })

        // 🎯 O AnimeFire injeta o player via JS
        // normalmente em "file":"URL"
        const match = data.match(/file":\s*"([^"]+)"/)

        if (match && match[1]) {
            return match[1].replace(/\\/g, '')
        }

        return null
    } catch (err) {
        console.error(
            '[AnimeFire] extractVideo error:',
            err.message
        )
        return null
    }
}

module.exports = {
    search,
    extractVideo
}
