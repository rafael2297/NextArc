export type MediaType = 'anime' | 'manga'

export interface JikanMediaBase {
  mal_id: number
  title: string
  synopsis: string | null
  score: number | null
  rank: number | null
  images: {
    jpg: {
      image_url: string
      large_image_url?: string
    }
  }
  rating?: string | null
  genres?: JikanTag[]
  explicit_genres?: JikanTag[]
}

export interface JikanTag {
  mal_id: number;
  name: string;
}

/* ===== ANIME ===== */
export interface JikanAnime extends JikanMediaBase {
  episodes: number | null
  status: string
}

/* ===== MANGA ===== */
export interface JikanManga extends JikanMediaBase {
  chapters: number | null
  type: string
}