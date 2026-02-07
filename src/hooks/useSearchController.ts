import { useCallback, useEffect, useRef, useState } from 'react'
import type { JikanAnime, JikanManga, JikanTag } from '../types/jikan'
import { searchAnime } from '../services/searchAnime'
import { searchManga } from '../services/searchManga'
import { fetchGenres } from '../services/jikanApi'
import { isNSFW } from '../utils/isNSFW'
import { useSessionStore } from '../store/useSessionStore'

/* ================== TYPES ================== */
export type SearchType = 'anime' | 'manga'
export type FilterMode = 'AND' | 'OR'
export type OrderBy = 'score' | 'rank' | 'popularity' | 'title'
export type SortDir = 'asc' | 'desc'

export interface SearchItem {
    id: number
    title: string
    image: string
    type: SearchType
    episodes?: number
    chapters?: number
    score?: number
    rank?: number
    format?: string
    rating?: string | null
    genres?: { mal_id: number; name: string }[]
    explicit_genres?: { mal_id: number; name: string }[]
}

const metadataCache = {
    animeGenres: null as JikanTag[] | null,
    mangaGenres: null as JikanTag[] | null,
}

const DEMOGRAPHICS: JikanTag[] = [
    { mal_id: 15, name: 'Kids' },
    { mal_id: 25, name: 'Shoujo' },
    { mal_id: 27, name: 'Shounen' },
    { mal_id: 41, name: 'Josei' },
    { mal_id: 42, name: 'Seinen' },
]

export function useSearchController() {
    const [searchType, setSearchType] = useState<SearchType>('anime')
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [hasNextPage, setHasNextPage] = useState(false)
    const [results, setResults] = useState<SearchItem[]>([])
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [searchFinished, setSearchFinished] = useState(false)
    const [nsfwFilteredOut, setNsfwFilteredOut] = useState(false)
    const [apiGenres, setApiGenres] = useState<JikanTag[]>([])
    const [apiDemographics] = useState<JikanTag[]>(DEMOGRAPHICS)

    const [filters, setFilters] = useState({
        search: '',
        genres: [] as number[],
        demographics: [] as number[],
        formats: [] as string[],
        mode: 'AND' as FilterMode,
        orderBy: 'score' as OrderBy,
        sort: 'desc' as SortDir,
        minScore: 0,
    })

    const nsfwMode = useSessionStore(s => s.nsfwMode)
    const isSearchingRef = useRef(false)

    /* ================== METADATA ================== */
    const loadMetadata = useCallback(async (type: SearchType) => {
        const key = type === 'anime' ? 'animeGenres' : 'mangaGenres'
        if (metadataCache[key]) {
            setApiGenres(metadataCache[key]!)
            return
        }
        try {
            const genres = await fetchGenres(type)
            metadataCache[key] = genres
            setApiGenres(genres)
        } catch (err) {
            console.error('Erro ao carregar gêneros', err)
        }
    }, [])

    useEffect(() => {
        loadMetadata(searchType)
    }, [searchType, loadMetadata])

    const hasValidSearchCriteria = useCallback(() => {
        return (
            filters.search.trim().length > 0 ||
            filters.genres.length > 0 ||
            filters.demographics.length > 0 ||
            filters.formats.length > 0 ||
            filters.minScore > 0
        )
    }, [filters])

    /* ================== CORE SEARCH LOGIC ================== */
    const runSearch = useCallback(
        async (reset = false) => {
            if (isSearchingRef.current || !hasValidSearchCriteria()) return

            isSearchingRef.current = true
            setLoading(true)

            let currentPage = reset ? 1 : page
            let accumulatedResults: SearchItem[] = []
            let shouldContinuePaging = true
            let foundContentInThisSession = false
            let apiHadDataButWasFiltered = false

            try {
                while (shouldContinuePaging) {
                    const response =
                        searchType === 'anime'
                            ? await searchAnime(
                                filters.search,
                                currentPage,
                                filters.genres,
                                filters.demographics,
                                filters.formats,
                                filters.orderBy,
                                filters.sort,
                                filters.minScore
                            )
                            : await searchManga(
                                filters.search,
                                currentPage,
                                filters.genres,
                                filters.demographics,
                                filters.formats,
                                filters.orderBy,
                                filters.sort,
                                filters.minScore
                            )

                    const mapped: SearchItem[] = response.data.map((item: any) => ({
                        id: item.mal_id,
                        title: item.title,
                        image: item.images.jpg.image_url,
                        type: searchType,
                        format: item.type,
                        score: item.score,
                        rank: item.rank,
                        episodes: item.episodes,
                        chapters: item.chapters,
                        rating: item.rating,
                        genres: item.genres,
                        explicit_genres: item.explicit_genres,
                    }))

                    const filtered = nsfwMode === 'hide'
                        ? mapped.filter(item => !isNSFW({
                            rating: item.rating,
                            genres: item.genres,
                            explicit_genres: item.explicit_genres,
                        }))
                        : mapped

                    if (mapped.length > 0 && filtered.length === 0) {
                        apiHadDataButWasFiltered = true
                    }

                    if (filtered.length > 0) {
                        accumulatedResults = filtered
                        foundContentInThisSession = true
                        shouldContinuePaging = false
                        setHasNextPage(response.hasNextPage)
                        setPage(currentPage + 1)
                    } else if (response.hasNextPage && nsfwMode === 'hide') {
                        currentPage++
                    } else {
                        shouldContinuePaging = false
                        setHasNextPage(false)
                    }
                }

                setResults(prev => (reset ? accumulatedResults : [...prev, ...accumulatedResults]))

                if (!foundContentInThisSession) {
                    setSearchFinished(true)
                    setNsfwFilteredOut(apiHadDataButWasFiltered)
                } else {
                    setNsfwFilteredOut(false)
                    setSearchFinished(true)
                }

            } catch (err) {
                console.warn('Erro na busca:', err)
                setHasNextPage(false)
                setSearchFinished(true)
            } finally {
                setLoading(false)
                isSearchingRef.current = false
            }
        },
        [filters, page, searchType, nsfwMode, hasValidSearchCriteria]
    )

    /* ================== HANDLERS ================== */
    const handleSearch = useCallback(() => {
        if (isSearchingRef.current) return

        setResults([])
        setPage(1)
        setSearchFinished(false)
        setNsfwFilteredOut(false)

        setTimeout(() => runSearch(true), 10)
    }, [runSearch])

    const handleTypeChange = (type: SearchType) => {
        setSearchType(type)
        setResults([])
        setPage(1)
        setSearchFinished(false)
        setNsfwFilteredOut(false)
        setFilters(prev => ({
            ...prev,
            genres: [],
            demographics: [],
            formats: [],
            minScore: 0
        }))
    }

    const handleFilterChange = useCallback((patch: Partial<typeof filters>) => {
        setFilters(prev => ({ ...prev, ...patch }));
    }, []);

    const handleClearFilters = () => {
        setFilters(f => ({
            ...f,
            genres: [],
            demographics: [],
            formats: [],
            mode: 'AND',
            orderBy: 'score',
            sort: 'desc',
            minScore: 0
        }))
    }

    /* ================== INFINITE SCROLL ================== */
    const observerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!observerRef.current || loading || !hasNextPage) return

        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && !isSearchingRef.current) {
                runSearch(false)
            }
        })

        observer.observe(observerRef.current)
        return () => observer.disconnect()
    }, [loading, hasNextPage, runSearch])

    return {
        filters,
        searchType,
        results,
        loading,
        hasNextPage,
        isFilterOpen,
        apiGenres,
        apiDemographics,
        observerRef,
        searchFinished,
        nsfwFilteredOut,
        setIsFilterOpen,
        setSearchValue: (v: string) => setFilters(f => ({ ...f, search: v })),
        handleTypeChange,
        handleSearch,
        handleFilterChange,
        handleClearFilters,
        hasValidSearchCriteria,
    }
}