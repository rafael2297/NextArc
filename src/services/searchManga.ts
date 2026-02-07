import { jikanApi } from './jikanApi'
import type { JikanManga } from '../types/jikan'

interface SearchMangaResponse {
  data: JikanManga[]
  hasNextPage: boolean
}

export async function searchManga(
  query: string,
  page: number = 1,
  genres?: number[],
  demographics?: number[],
  formats?: string[],
  orderBy: string = 'score',
  sort: string = 'desc',
  minScore?: number
): Promise<SearchMangaResponse> {
  const combinedGenres = [...(genres || []), ...(demographics || [])].join(',')
  const type = formats && formats.length > 0 ? formats.join(',') : undefined

  const response = await jikanApi.get('/manga', {
    params: {
      q: query || undefined,
      page,
      limit: 24,
      genres: combinedGenres || undefined,
      type: type,
      order_by: orderBy,
      sort: sort,
      min_score: minScore && minScore > 0 ? minScore : undefined,
    },
  })

  return {
    data: response.data.data,
    hasNextPage: response.data.pagination?.has_next_page ?? false,
  }
}