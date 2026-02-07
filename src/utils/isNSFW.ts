import type { JikanTag } from '../types/jikan'

/**
 * Determina se um anime ou manga deve ser tratado como NSFW
 * Regra centralizada para todo o app
 */
export function isNSFW(item: {
    rating?: string | null
    genres?: JikanTag[] | null
    explicit_genres?: JikanTag[] | null
}): boolean {
    // 🔞 Classificação explícita da API
    if (item.rating?.toLowerCase() === 'rx') return true

    // 🔞 Gêneros considerados sensíveis
    const NSFW_GENRES = new Set([
        'hentai',
        'ecchi',
        'erotica',
        'erotic',
        'sexual content',
    ])

    const allGenres = [
        ...(item.genres ?? []),
        ...(item.explicit_genres ?? []),
    ]

    return allGenres.some(tag =>
        NSFW_GENRES.has(tag.name.toLowerCase())
    )
}
