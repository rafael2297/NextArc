import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  Calendar,
  Filter,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import Layout from '../components/layout/Layout'
import SeasonalAnimeCard from '../components/cards/SeasonalAnimeCard'
import { useAppStore } from '../store/useAppStore'
import { useSessionStore } from '../store/useSessionStore'
import { useToast } from '../components/toast/useToast'
import { useProfileStore } from '../store/useProfileStore'
import { hexToRgba, getContrastColor, getBorderColor } from '../utils/colors'

type Season = 'winter' | 'spring' | 'summer' | 'fall'

interface SeasonalAnime {
  id: number
  title: string
  cover: string
  episodes?: number
  score?: number
  rank?: number
}

const seasons: { key: Season; label: string; icon: string }[] = [
  { key: 'winter', label: 'Inverno', icon: '❄️' },
  { key: 'spring', label: 'Primavera', icon: '🌸' },
  { key: 'summer', label: 'Verão', icon: '☀️' },
  { key: 'fall', label: 'Outono', icon: '🍂' },
]

const currentYear = new Date().getFullYear()

export default function Seasonal() {
  const { addAnime, hasAnime } = useAppStore()
  const { hasAccess } = useSessionStore()
  const { showToast } = useToast()

  // SISTEMA DE CORES E PERFIL (Baseado no Search.tsx)
  const profile = useProfileStore((state) => state.profile)
  const theme = profile.theme
  const textColor = getContrastColor(theme.background)
  const subTextColor = hexToRgba(textColor, 0.5)
  const borderColor = getBorderColor(theme.background)
  const contrastOnPrimary = getContrastColor(theme.primary)

  const isLightSide = textColor === '#000000'

  const [year, setYear] = useState<number>(currentYear)
  const [season, setSeason] = useState<Season>(() => {
    const month = new Date().getMonth()
    if (month <= 2) return 'winter'
    if (month <= 5) return 'spring'
    if (month <= 8) return 'summer'
    return 'fall'
  })

  const [page, setPage] = useState<number>(1)
  const [hasNextPage, setHasNextPage] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)
  const [results, setResults] = useState<SeasonalAnime[]>([])

  const observerRef = useRef<HTMLDivElement | null>(null)
  const fetchingRef = useRef<boolean>(false)

  const fetchSeasonal = useCallback(
    async (reset = false) => {
      if (fetchingRef.current) return
      if (!hasNextPage && !reset) return

      fetchingRef.current = true
      setLoading(true)

      try {
        const currentPage = reset ? 1 : page
        const res = await fetch(
          `https://api.jikan.moe/v4/seasons/${year}/${season}?page=${currentPage}`
        )
        const json = await res.json()

        const mapped: SeasonalAnime[] = json.data.map((item: any) => ({
          id: item.mal_id,
          title: item.title,
          cover: item.images.jpg.image_url,
          episodes: item.episodes ?? undefined,
          score: item.score ?? undefined,
          rank: item.rank ?? undefined,
        }))

        setResults((prev) => (reset ? mapped : [...prev, ...mapped]))
        setHasNextPage(json.pagination?.has_next_page ?? false)
        setPage((p) => (reset ? 2 : p + 1))
      } catch {
        showToast('Erro ao carregar temporada', 'error')
      } finally {
        fetchingRef.current = false
        setLoading(false)
      }
    },
    [year, season, page, hasNextPage, showToast]
  )

  useEffect(() => {
    setResults([])
    setPage(1)
    setHasNextPage(true)
    fetchSeasonal(true)
  }, [year, season])

  useEffect(() => {
    if (!observerRef.current || loading || !hasNextPage) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchSeasonal()
      },
      { threshold: 0.1 }
    )

    observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [fetchSeasonal, loading, hasNextPage])

  function handleAdd(item: SeasonalAnime) {
    if (!hasAccess) return showToast('Entre para adicionar', 'warning')
    if (hasAnime(item.id)) return showToast('Já está na lista', 'info')

    addAnime({
      id: item.id,
      title: item.title,
      cover: item.cover,
      totalEpisodes: item.episodes ?? 0,
      currentEpisode: 0,
      status: 'watching',
    })
    showToast('Adicionado à lista!', 'success')
  }

  return (
    <Layout>
      {/* HERO COM BANNER (IDÊNTICO AO SEARCH.TSX) */}
      <div className="relative h-[380px] -mt-16 overflow-hidden flex items-center justify-center">
        {profile.banner ? (
          <img
            src={profile.banner}
            className="absolute inset-0 w-full h-full object-cover"
            alt="Banner"
          />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: theme.navbar }} />
        )}

        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{
            backgroundImage: `linear-gradient(to top, ${theme.background} 0%, ${hexToRgba(theme.background, 0.4)} 60%, transparent 100%)`
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex flex-col items-center text-center gap-4 px-6"
        >
          <div
            className="p-4 rounded-[2rem] shadow-2xl"
            style={{
              backgroundColor: theme.primary,
              boxShadow: `0 0 40px ${hexToRgba(theme.primary, 0.3)}`
            }}
          >
            <Calendar
              style={{ color: getContrastColor(theme.primary) }}
              strokeWidth={3}
              size={32}
            />
          </div>
          <div>
            <h1 className="text-5xl font-black uppercase italic leading-none" style={{ color: textColor }}>
              Temporadas
            </h1>
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.4em] italic" style={{ color: subTextColor }}>
              Explorador de <span style={{ color: theme.primary }}>Lançamentos</span>
            </p>
          </div>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-20 pb-20">

        {/* CONTROLES FLUTUANTES GIGANTES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* SELETOR DE ANO */}
          <div
            className="lg:col-span-4 backdrop-blur-3xl border rounded-[3rem] p-2.5 flex items-center justify-between shadow-2xl transition-all"
            style={{ backgroundColor: hexToRgba(theme.navbar, 0.85), borderColor: borderColor }}
          >
            <button
              onClick={() => setYear(y => y - 1)}
              className="w-16 h-16 flex items-center justify-center rounded-[2.2rem] transition-all active:scale-90 border"
              style={{ backgroundColor: hexToRgba(textColor, 0.03), borderColor: borderColor, color: textColor }}
            >
              <ChevronLeft size={28} />
            </button>

            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1" style={{ color: theme.primary }}>Era</p>
              <p className="text-4xl font-black italic tracking-tighter" style={{ color: textColor }}>{year}</p>
            </div>

            <button
              onClick={() => setYear(y => y + 1)}
              className="w-16 h-16 flex items-center justify-center rounded-[2.2rem] transition-all active:scale-90 border"
              style={{ backgroundColor: hexToRgba(textColor, 0.03), borderColor: borderColor, color: textColor }}
            >
              <ChevronRight size={28} />
            </button>
          </div>

          {/* SELETOR DE ESTAÇÃO */}
          <div
            className="lg:col-span-8 backdrop-blur-3xl border rounded-[3rem] p-2.5 grid grid-cols-2 md:grid-cols-4 gap-3 shadow-2xl transition-all"
            style={{ backgroundColor: hexToRgba(theme.navbar, 0.85), borderColor: borderColor }}
          >
            {seasons.map((s) => (
              <button
                key={s.key}
                onClick={() => setSeason(s.key)}
                className="relative group overflow-hidden rounded-[2.5rem] py-5 transition-all duration-500 border"
                style={{
                  color: season === s.key ? contrastOnPrimary : subTextColor,
                  borderColor: season === s.key ? theme.primary : 'transparent'
                }}
              >
                {season === s.key && (
                  <motion.div
                    layoutId="activeSeasonBg"
                    className="absolute inset-0"
                    style={{ backgroundColor: theme.primary }}
                  />
                )}
                <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                  <span className="text-2xl group-hover:scale-125 transition-transform duration-500">{s.icon}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest italic">{s.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* LISTAGEM */}
        <div className="mt-20 space-y-10">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div
                className="p-3 border rounded-2xl shadow-sm"
                style={{ backgroundColor: hexToRgba(theme.navbar, 0.5), borderColor: borderColor }}
              >
                <Filter size={20} style={{ color: theme.primary }} />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-tighter italic" style={{ color: textColor }}>
                  {season} de {year}
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: subTextColor }}>Base de dados Jikan</p>
              </div>
            </div>
            <div
              className="h-px flex-1 mx-10 hidden md:block"
              style={{ background: `linear-gradient(to right, ${borderColor}, transparent)` }}
            />
            {/* Contador de resultados similar ao box de stats que você tinha */}
            <div className="px-6 py-2 rounded-2xl border text-[11px] font-black uppercase italic tracking-wider" style={{ borderColor: borderColor, color: theme.primary, backgroundColor: hexToRgba(theme.primary, 0.05) }}>
              {results.length} Títulos
            </div>
          </div>

          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-10"
          >
            <AnimatePresence mode='popLayout'>
              {results.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4 }}
                >
                  <SeasonalAnimeCard
                    {...item}
                    image={item.cover}
                    isAdded={hasAnime(item.id)}
                    onAdd={() => handleAdd(item)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* LOADING STATE */}
          <div ref={observerRef} className="py-24 flex flex-col items-center justify-center gap-6">
            {loading ? (
              <div className="flex flex-col items-center gap-5">
                <div className="relative">
                  <Loader2 className="animate-spin" style={{ color: theme.primary }} size={48} strokeWidth={3} />
                  <div className="absolute inset-0 blur-2xl opacity-50" style={{ backgroundColor: theme.primary }} />
                </div>
                <p className="text-[11px] font-black tracking-[0.5em] uppercase animate-pulse" style={{ color: subTextColor }}>
                  Buscando Temporada
                </p>
              </div>
            ) : !hasNextPage && results.length > 0 ? (
              <div className="flex flex-col items-center gap-3 opacity-50">
                <Sparkles size={32} style={{ color: theme.primary }} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: textColor }}>
                  Você explorou tudo
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  )
}