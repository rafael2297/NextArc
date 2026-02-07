import {
    Search as SearchIcon,
    Sparkles,
    Loader2,
    ChevronUp,
    Filter,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import AnimeMangaCard from '../components/cards/SearchAnimeMangaCard'
import SearchInput from '../components/filters/SearchInput'
import AdvancedMediaFilter from '../components/filters/AdvancedMediaFilter'
import NoResults from '../components/NoResults'
import Layout from '../components/layout/Layout'

import { useSearchController } from '../hooks/useSearchController'
import { useAppStore } from '../store/useAppStore'
import { useProfileStore } from '../store/useProfileStore'
import { hexToRgba, getContrastColor, getBorderColor } from '../utils/colors'

/* ... imports (mantenha os mesmos) ... */

export default function Search() {
    const {
        filters, searchType, results, loading, hasNextPage, isFilterOpen,
        apiGenres, apiDemographics, observerRef, searchFinished, nsfwFilteredOut,
        setIsFilterOpen, setSearchValue, handleTypeChange, handleSearch,
        handleFilterChange, handleClearFilters, hasValidSearchCriteria,
    } = useSearchController()

    const { addAnime, addManga, hasAnime, hasManga, getAnimeById, getMangaById } = useAppStore()
    const theme = useProfileStore((state) => state.profile.theme)
    const profile = useProfileStore((state) => state.profile)
    const textColor = getContrastColor(theme.background)
    const subTextColor = hexToRgba(textColor, 0.5)
    const borderColor = getBorderColor(theme.background)

    const hasSearched = filters.search.trim().length > 0 || filters.genres.length > 0 || filters.demographics.length > 0
    const hasNoResults = hasSearched && searchFinished && !loading && results.length === 0

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && hasValidSearchCriteria()) handleSearch()
    }

    function handleAdd(item: any) {
        if (item.type === 'anime') {
            if (hasAnime(item.id)) return
            addAnime({ id: item.id, title: item.title, cover: item.image, totalEpisodes: item.episodes ?? 0, currentEpisode: 0, status: 'planned' })
        } else {
            if (hasManga(item.id)) return
            addManga({ id: item.id, title: item.title, cover: item.image, totalChapters: item.chapters ?? 0, currentChapter: 0, status: 'planned', format: 'manga' })
        }
    }

    return (
        <Layout>
            {/* HERO SECTION */}
            <div className="relative h-[380px] -mt-16 overflow-hidden flex items-center justify-center">
                {profile.banner ? (
                    <img src={profile.banner} className="absolute inset-0 w-full h-full object-cover" alt="Banner" />
                ) : (
                    <div className="absolute inset-0" style={{ backgroundColor: theme.navbar }} />
                )}
                <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(to top, ${theme.background} 0%, ${hexToRgba(theme.background, 0.4)} 60%, transparent 100%)` }} />

                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 flex flex-col items-center text-center gap-4 px-6">
                    <div className="p-4 rounded-[2rem] shadow-2xl" style={{ backgroundColor: theme.primary, boxShadow: `0 0 40px ${hexToRgba(theme.primary, 0.3)}` }}>
                        <SearchIcon style={{ color: getContrastColor(theme.primary) }} strokeWidth={3} size={32} />
                    </div>
                    <h1 className="text-5xl font-black uppercase italic leading-none" style={{ color: textColor }}>Descoberta</h1>
                </motion.div>
            </div>

            {/* AREA DE CONTEÚDO COM CAMADAS EXPLÍCITAS */}
            <div className="max-w-6xl mx-auto px-4 -mt-12 pb-32 relative">

                {/* 1. CAMADA DE FILTROS (Z-INDEX ALTO) */}
                <section className="relative z-[100]">
                    <motion.div
                        className="backdrop-blur-3xl rounded-[3rem] p-6 border shadow-2xl overflow-visible"
                        style={{ backgroundColor: hexToRgba(theme.navbar, 0.85), borderColor: borderColor }}
                    >
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1" onKeyDown={handleKeyPress}>
                                <SearchInput value={filters.search} onChange={setSearchValue} placeholder="O que você quer assistir ou ler hoje?" />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={loading || !hasValidSearchCriteria()}
                                className="rounded-[1.5rem] px-10 py-5 font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center gap-3 transition-all enabled:hover:scale-105 disabled:opacity-50"
                                style={{ backgroundColor: theme.primary, color: getContrastColor(theme.primary) }}
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={18} fill="currentColor" /> Pesquisar</>}
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-6">
                            <div className="flex p-1.5 rounded-[1.2rem] border min-w-[240px]" style={{ backgroundColor: hexToRgba(theme.background, 0.5), borderColor: borderColor }}>
                                {(['anime', 'manga'] as const).map(type => (
                                    <button key={type} onClick={() => handleTypeChange(type)} className="flex-1 py-3 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                        style={{ backgroundColor: searchType === type ? theme.primary : 'transparent', color: searchType === type ? getContrastColor(theme.primary) : subTextColor }}>
                                        {type}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setIsFilterOpen(v => !v)} className="flex items-center gap-2 px-6 py-3.5 rounded-[1.2rem] border text-[10px] font-black uppercase tracking-widest"
                                style={{ backgroundColor: hexToRgba(theme.background, 0.5), borderColor: borderColor, color: textColor }}>
                                <Filter size={16} strokeWidth={3} style={{ color: theme.primary }} />
                                Filtros Avançados
                                <ChevronUp size={16} className={`transition-transform ${!isFilterOpen && 'rotate-180'}`} />
                            </button>
                        </div>

                        <AnimatePresence>
                            {isFilterOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mt-8 pt-8 border-t overflow-visible"
                                    style={{ borderColor: borderColor }}
                                >
                                    <AdvancedMediaFilter
                                        search={filters.search}
                                        searchType={searchType}
                                        selectedGenres={filters.genres}
                                        selectedDemographics={filters.demographics}
                                        selectedFormats={filters.formats} // Certifique-se que isso não é undefined
                                        mode={filters.mode}
                                        minScore={filters.minScore}
                                        orderBy={filters.orderBy}
                                        sort={filters.sort}
                                        genres={apiGenres}
                                        demographics={apiDemographics}
                                        onChange={handleFilterChange} // A função do useSearchController
                                        onClear={handleClearFilters}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </section>

                {/* 2. CAMADA DE RESULTADOS (Z-INDEX BAIXO) */}
                <section className="mt-16 relative z-[1]">
                    {results.length > 0 && (
                        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {results.map(item => {
                                const isAdded = item.type === 'anime' ? hasAnime(item.id) : hasManga(item.id)
                                const existing = item.type === 'anime' ? getAnimeById(item.id) : getMangaById(item.id)
                                return (
                                    <AnimeMangaCard
                                        key={`${item.type}-${item.id}`}
                                        {...item}
                                        onAdd={() => handleAdd(item)}
                                        isAdded={isAdded}
                                        existingStatus={existing?.status}
                                    />
                                )
                            })}
                        </div>
                    )}

                    {hasNoResults && (
                        <NoResults reason={nsfwFilteredOut ? 'nsfw-filtered' : 'no-match'} searchTerm={filters.search} />
                    )}

                    <div ref={observerRef} className="py-20 flex justify-center">
                        {loading && hasNextPage && (
                            <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{ borderTopColor: theme.primary, borderColor: hexToRgba(theme.primary, 0.1) }} />
                        )}
                    </div>
                </section>
            </div>
        </Layout>
    )
}