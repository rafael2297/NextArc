import { useState, useMemo } from 'react'
import {
  Film, BookOpen, ChevronUp, ChevronDown,
  LayoutGrid, List, Plus, Minus, Trash2, Filter, Check
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import LibraryAnimeMangaCard from '../components/cards/LibraryAnimeMangaCard'
import { useAppStore } from '../store/useAppStore'
import { useProfileController } from '../hooks/useSettingsController'
import type { AnimeStatus, ReadingStatus } from '../store/useAppStore'

type ViewMode = 'grid' | 'list'
type FilterStatus = 'all' | 'watching' | 'reading' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch'

export default function Library() {
  const { profile } = useProfileController()
  const animeList = useAppStore((state) => state.animeList)
  const mangaList = useAppStore((state) => state.mangaList)
  const { updateAnime, updateManga, removeAnime, removeManga, updateProgress } = useAppStore()

  // --- LÓGICA DE TEMAS ---
  const currentTheme = {
    primary: profile?.theme?.primary || '#3b82f6',
    background: profile?.theme?.background || '#000000',
    navbar: profile?.theme?.navbar || '#111111'
  };
  const isLight = currentTheme.background.toLowerCase() === '#ffffff' || currentTheme.background.toLowerCase() === 'white';

  // Estados de controle
  const [isAnimeMinimized, setIsAnimeMinimized] = useState(false)
  const [isMangaMinimized, setIsMangaMinimized] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Opções do Filtro
  const filterOptions = [
    { id: 'all', label: 'Todos' },
    { id: 'watching', label: 'Assistindo / Lendo' },
    { id: 'completed', label: 'Completos' },
    { id: 'on_hold', label: 'Em Espera' },
    { id: 'dropped', label: 'Abandonados' },
    { id: 'plan_to_watch', label: 'Planejados' },
  ]

  const currentFilterLabel = filterOptions.find(opt => opt.id === filterStatus)?.label

  // Filtragem Memoizada
  const filteredAnimes = useMemo(() => {
    if (filterStatus === 'all') return animeList
    return animeList.filter(anime => anime.status.toLowerCase() === filterStatus.toLowerCase())
  }, [animeList, filterStatus])

  const filteredMangas = useMemo(() => {
    if (filterStatus === 'all') return mangaList
    const mangaFilter = filterStatus === 'watching' ? 'reading' : filterStatus
    return mangaList.filter(manga => manga.status.toLowerCase() === mangaFilter.toLowerCase())
  }, [mangaList, filterStatus])

  // Sub-componente para o Modo Lista
  const ListViewItem = ({ item, type }: { item: any, type: 'anime' | 'manga' }) => {
    const current = type === 'anime' ? item.currentEpisode : item.currentChapter
    const total = type === 'anime' ? item.totalEpisodes : item.totalChapters

    const handleUpdate = (newValue: number) => {
      if (newValue < 0) return;
      if (type === 'anime') {
        updateAnime(item.id, { currentEpisode: newValue });
      } else {
        updateManga(item.id, { currentChapter: newValue });
      }
    };

    return (
      <div className="flex items-center justify-between p-4 border rounded-2xl transition-all group"
        style={{
          backgroundColor: isLight ? '#f4f4f5' : 'rgba(255,255,255,0.03)',
          borderColor: isLight ? '#e4e4e7' : 'rgba(255,255,255,0.05)'
        }}>
        <div className="flex items-center gap-4">
          <img src={item.cover} className="w-10 h-14 rounded-lg object-cover shadow-sm" alt="" />
          <div className="flex flex-col">
            <h3 className="text-xs font-black uppercase truncate max-w-[120px] sm:max-w-[400px]" style={{ color: isLight ? '#000' : '#fff' }}>{item.title}</h3>
            <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5 opacity-50" style={{ color: isLight ? '#71717a' : '#a1a1aa' }}>{item.status}</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl border"
            style={{ backgroundColor: isLight ? '#fff' : '#000', borderColor: isLight ? '#e4e4e7' : 'rgba(255,255,255,0.1)' }}>
            <button onClick={() => handleUpdate(current - 1)} className="text-zinc-500 hover:text-red-500 transition-colors p-1"><Minus size={14} /></button>
            <div className="flex flex-col items-center min-w-[40px]">
              <span className="text-xs font-black leading-none" style={{ color: currentTheme.primary }}>{current}</span>
              <span className="text-[8px] text-zinc-600 font-bold uppercase">/ {total || '?'}</span>
            </div>
            <button onClick={() => handleUpdate(current + 1)} className="text-zinc-500 hover:text-emerald-500 transition-colors p-1"><Plus size={14} /></button>
          </div>
          <button onClick={() => type === 'anime' ? removeAnime(item.id) : removeManga(item.id)} className="text-zinc-500 hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100"><Trash2 size={16} /></button>
        </div>
      </div>
    )
  }


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-32 overflow-x-hidden transition-colors duration-500"
      style={{ backgroundColor: currentTheme.background }}
    >
      {/* --- HEADER COM BANNER PERSONALIZADO --- */}
      <div
        className="relative h-[320px] flex items-end pb-12 px-6"
        style={{
          zIndex: isFilterOpen ? 100 : 10, // Aumenta o z-index quando o filtro abre
          backgroundColor: currentTheme.background
        }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={profile.banner || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070'}
            className="w-full h-full object-cover opacity-40 scale-105"
            alt="Banner"
          />
          <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(to bottom, transparent, ${currentTheme.background})` }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto w-full flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="px-2 py-0.5 w-fit rounded-md text-[9px] font-black uppercase tracking-widest italic"
              style={{ backgroundColor: `${currentTheme.primary}20`, color: currentTheme.primary, border: `1px solid ${currentTheme.primary}40` }}>
              Library Collection
            </div>
            <h1 className="text-4xl font-black tracking-tighter italic uppercase" style={{ color: isLight ? '#000' : '#fff' }}>Biblioteca</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filtro Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-3 border rounded-xl px-4 py-2.5 transition-all active:scale-95 shadow-xl"
                style={{
                  backgroundColor: isLight ? '#fff' : '#09090b',
                  borderColor: isFilterOpen ? currentTheme.primary : (isLight ? '#e4e4e7' : 'rgba(255,255,255,0.1)'),
                  color: isLight ? '#000' : '#fff'
                }}
              >
                <Filter size={14} style={{ color: isFilterOpen ? currentTheme.primary : '#71717a' }} />
                <span className="text-[10px] font-black uppercase tracking-widest italic">{currentFilterLabel}</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <>
                    <div className="fixed inset-0 z-[110]" onClick={() => setIsFilterOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 5, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 border rounded-2xl shadow-2xl backdrop-blur-xl z-[120] overflow-hidden"
                      style={{
                        backgroundColor: isLight ? 'rgba(255,255,255,0.98)' : 'rgba(15, 15, 15, 0.98)',
                        borderColor: isLight ? '#e4e4e7' : '#27272a'
                      }}
                    >
                      <div className="p-2 space-y-1">
                        {filterOptions.map((opt) => (
                          <button key={opt.id} onClick={() => { setFilterStatus(opt.id as FilterStatus); setIsFilterOpen(false); }}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                            style={{
                              backgroundColor: filterStatus === opt.id ? `${currentTheme.primary}15` : 'transparent',
                              color: filterStatus === opt.id ? currentTheme.primary : (isLight ? '#555' : '#999')
                            }}
                          >
                            {opt.label}
                            {filterStatus === opt.id && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* View Mode */}
            <div className="flex p-1 rounded-xl border shadow-inner" style={{ backgroundColor: isLight ? '#f4f4f5' : '#09090b', borderColor: isLight ? '#e4e4e7' : 'rgba(255,255,255,0.05)' }}>
              <button onClick={() => setViewMode('grid')} className="p-2 rounded-lg transition-all" style={{ backgroundColor: viewMode === 'grid' ? currentTheme.primary : 'transparent', color: viewMode === 'grid' ? '#fff' : '#71717a' }}>
                <LayoutGrid size={16} />
              </button>
              <button onClick={() => setViewMode('list')} className="p-2 rounded-lg transition-all" style={{ backgroundColor: viewMode === 'list' ? currentTheme.primary : 'transparent', color: viewMode === 'list' ? '#fff' : '#71717a' }}>
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTEÚDO --- */}
      <div className="max-w-6xl mx-auto px-4 space-y-10 relative z-0">

        {/* SEÇÃO ANIMES */}
        <section className="relative">
          <div className="flex items-center justify-between mb-6 px-1">
            <button className="flex items-center gap-3 group outline-none" onClick={() => setIsAnimeMinimized(!isAnimeMinimized)}>
              <div className="p-2.5 rounded-2xl transition-colors shadow-lg" style={{ backgroundColor: `${currentTheme.primary}15`, color: currentTheme.primary }}>
                <Film size={20} />
              </div>
              <h2 className="text-sm font-black uppercase tracking-[0.25em] italic" style={{ color: isLight ? '#000' : '#eee' }}>Animes</h2>
              <motion.div animate={{ rotate: isAnimeMinimized ? 180 : 0 }}><ChevronUp size={16} className="text-zinc-600" /></motion.div>
            </button>
            <div className="h-px flex-1 mx-8 opacity-20" style={{ background: `linear-gradient(to right, ${currentTheme.primary}, transparent)` }} />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">{filteredAnimes.length} Units</span>
          </div>

          <AnimatePresence>
            {!isAnimeMinimized && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className={viewMode === 'grid' ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 pb-6" : "space-y-3 pb-6"}>
                  {filteredAnimes.map((anime) => (
                    <motion.div key={anime.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {viewMode === 'grid' ? (
                        <LibraryAnimeMangaCard id={anime.id} type="anime" title={anime.title} image={anime.cover} status={anime.status} current={anime.currentEpisode} total={anime.totalEpisodes}
                          onChangeStatus={(s) => updateAnime(anime.id, { status: s as AnimeStatus })}
                          onChangeCurrent={(v) => updateProgress(anime.id, v, 'anime')}
                          onChangeTotal={(v) => updateAnime(anime.id, { totalEpisodes: v })}
                          onRemove={() => removeAnime(anime.id)}
                        />
                      ) : (<ListViewItem item={anime} type="anime" />)}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* SEÇÃO MANGÁS */}
        <section className="relative">
          <div className="flex items-center justify-between mb-6 px-1">
            <button className="flex items-center gap-3 group outline-none" onClick={() => setIsMangaMinimized(!isMangaMinimized)}>
              <div className="p-2.5 rounded-2xl shadow-lg" style={{ backgroundColor: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <BookOpen size={20} />
              </div>
              <h2 className="text-sm font-black uppercase tracking-[0.25em] italic" style={{ color: isLight ? '#000' : '#eee' }}>Mangás</h2>
              <motion.div animate={{ rotate: isMangaMinimized ? 180 : 0 }}><ChevronUp size={16} className="text-zinc-600" /></motion.div>
            </button>
            <div className="h-px flex-1 mx-8 opacity-20" style={{ background: `linear-gradient(to right, #10b981, transparent)` }} />
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">{filteredMangas.length} Units</span>
          </div>

          <AnimatePresence>
            {!isMangaMinimized && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className={viewMode === 'grid' ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 pb-6" : "space-y-3 pb-6"}>
                  {filteredMangas.map((manga) => (
                    <motion.div key={manga.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {viewMode === 'grid' ? (
                        <LibraryAnimeMangaCard id={manga.id} type="manga" title={manga.title} image={manga.cover} status={manga.status} current={manga.currentChapter} total={manga.totalChapters}
                          onChangeStatus={(s) => updateManga(manga.id, { status: s as ReadingStatus })}
                          onChangeCurrent={(v) => updateProgress(manga.id, v, 'manga')}
                          onChangeTotal={(v) => updateManga(manga.id, { totalChapters: v })}
                          onRemove={() => removeManga(manga.id)}
                        />
                      ) : (<ListViewItem item={manga} type="manga" />)}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </motion.div>
  )
}