import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import MediaDetailsLayout from './MediaDetails.view'
import { fetchMediaDetails } from '../../services/jikanApi'
import type {
    MediaType,
    JikanAnime,
    JikanManga,
} from '../../services/jikanApi'
import { useAppStore } from '../../store/useAppStore'

type MediaData = JikanAnime | JikanManga

export default function MediaDetailsContainer() {
    const { type, id } = useParams<{ type?: string; id?: string }>()

    const [data, setData] = useState<MediaData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const {
        addAnime,
        addManga,
        hasAnime,
        hasManga,
    } = useAppStore()

    useEffect(() => {
        if (!type || !id || (type !== 'anime' && type !== 'manga')) {
            setError(true)
            setLoading(false)
            return
        }

        let cancelled = false

        async function load() {
            try {
                const result = await fetchMediaDetails<MediaData>(
                    type as MediaType,
                    Number(id)
                )

                if (!cancelled) {
                    setData(result)
                }
            } catch {
                if (!cancelled) setError(true)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        load()

        return () => {
            cancelled = true
        }
    }, [type, id])

    const isAdded = useMemo(() => {
        if (!data || !type) return false

        return type === 'anime'
            ? hasAnime(data.mal_id)
            : hasManga(data.mal_id)
    }, [data, type, hasAnime, hasManga])

    function handleAdd() {
        if (!data || !type) return

        if (type === 'anime') {
            const anime = data as JikanAnime

            addAnime({
                id: anime.mal_id,
                title: anime.title,
                cover: anime.images.jpg.image_url,
                totalEpisodes: anime.episodes ?? 0,
                currentEpisode: 0,
                status: 'watching',
            })
        }

        if (type === 'manga') {
            const manga = data as JikanManga

            addManga({
                id: manga.mal_id,
                title: manga.title,
                cover: manga.images.jpg.image_url,
                totalChapters: manga.chapters ?? 0,
                currentChapter: 0,
                status: 'reading',
                format: 'manga',
            })
        }
    }

    return (
        <MediaDetailsLayout
            loading={loading}
            error={error}
            data={data}
            mediaType={type as MediaType}
            isAdded={isAdded}
            onAdd={handleAdd}
        />
    )
}
