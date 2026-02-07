import axios from 'axios'

/* =========================
   AXIOS INSTANCE
========================= */
export const jikanApi = axios.create({
  baseURL: 'https://api.jikan.moe/v4',
  timeout: 15000,
})

/* =========================
   TIPOS BASE
========================= */
export type MediaType = 'anime' | 'manga'

export interface JikanImage {
  image_url: string
  large_image_url?: string
}

export interface JikanImages {
  jpg: JikanImage
  webp?: JikanImage
}

export interface JikanTag {
  mal_id: number
  name: string
}

export interface JikanMediaBase {
  mal_id: number
  title: string
  synopsis: string | null
  score: number | null
  rank: number | null
  images: JikanImages

  genres: JikanTag[]
  themes: JikanTag[]
  demographics: JikanTag[]

  // 🔞 Campos NSFW
  rating?: string | null
  explicit_genres?: JikanTag[]
}

/* =========================
   ANIME
========================= */
export interface JikanAnime extends JikanMediaBase {
  episodes: number | null
  status: string

  trailer?: {
    youtube_id?: string | null
    url?: string | null
    embed_url?: string | null
  }
}

/* =========================
   MANGA
========================= */
export interface JikanManga extends JikanMediaBase {
  chapters: number | null
  type: string
}

/* =========================
   METADATA – GENRES & DEMOGRAPHICS
========================= */

/**
 * Busca a lista de gêneros oficiais da API.
 * O parâmetro 'filter' pode ser usado para buscar 'genres', 'themes' ou 'explicit_genres'.
 */
export async function fetchGenres(type: MediaType) {
  const response = await jikanApi.get<{ data: JikanTag[] }>(`/genres/${type}`)
  return response.data.data
}

/**
 * Busca a lista de demografias (Ex: Shounen, Seinen) da API.
 * Na Jikan v4, as demografias ficam em um endpoint específico de gêneros filtrado por tipo.
 */
export async function fetchDemographics(type: MediaType) {
  // A API Jikan v4 retorna demografias dentro de genres com o filtro ?filter=demographics
  const response = await jikanApi.get<{ data: JikanTag[] }>(`/genres/${type}?filter=demographics`)
  return response.data.data
}

/* =========================
   FETCH GENÉRICO – DETAILS
========================= */
export async function fetchMediaDetails<T>(
  type: MediaType,
  id: number
): Promise<T> {
  const response = await jikanApi.get<{ data: T }>(
    `/${type}/${id}/full`
  )

  return response.data.data
}

/* =========================
   FETCH – CHARACTERS
========================= */
export async function fetchMediaCharacters(type: 'anime' | 'manga', id: number) {
  const response = await fetch(`https://api.jikan.moe/v4/${type}/${id}/characters`);
  const data = await response.json();
  return data.data; // Retorna array de personagens
}

/* =========================
   FETCH – REVIEWS
========================= */
export async function fetchMediaReviews(type: 'anime' | 'manga', id: number) {
  const response = await fetch(`https://api.jikan.moe/v4/${type}/${id}/reviews`);
  const data = await response.json();
  return data.data; // Retorna array de reviews
}

