import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, Star, Trophy, Tv, Activity, Youtube, Search } from 'lucide-react'

import Layout from '../../components/layout/Layout'
import { useProfileStore } from '../../store/useProfileStore'
import { hexToRgba, getContrastColor } from '../../utils/colors'
import { useAppStore } from '../../store/useAppStore'

import type {
    MediaType,
    JikanAnime,
    JikanManga,
} from '../../services/jikanApi'

import MediaInfoTab from './tabs/MediaInfoTab'
import MediaCharactersTab from './tabs/MediaCharactersTab'
import MediaReviewsTab from './tabs/MediaReviewsTab'
import MediaEpisodesTab from './tabs/MediaEpisodesTab'

type MediaData = JikanAnime | JikanManga
type MediaTab = 'info' | 'episodes' | 'characters' | 'reviews'

interface Props {
    loading: boolean
    error: boolean
    data: MediaData | null
    mediaType: MediaType
    isAdded: boolean
    onAdd: () => void
    // Novos campos para a lógica de Match
    suggestions?: MediaData[]
    onSelectSuggestion?: (id: number) => void
}

const tabs: { key: MediaTab; label: string }[] = [
    { key: 'info', label: 'Informações' },
    { key: 'episodes', label: 'Episódios' },
    { key: 'characters', label: 'Personagens' },
    { key: 'reviews', label: 'Reviews' },
]

interface InfoBadgeProps {
    icon: any;
    label: string;
    value: string | number;
    color?: string;
    themeNavbar: string;
    textColor: string;
}

const InfoBadge = ({ icon: Icon, label, value, color, themeNavbar, textColor }: InfoBadgeProps) => (
    <div
        className="flex items-center gap-2 backdrop-blur-md px-3 py-2 rounded-xl border min-w-0 max-w-full flex-shrink"
        style={{
            backgroundColor: hexToRgba(themeNavbar, 0.8),
            borderColor: hexToRgba(textColor, 0.05),
            color: color || textColor
        }}
    >
        <Icon size={14} className={color === '#fbbf24' ? "fill-amber-400" : ""} />
        <div className="flex flex-col leading-none overflow-hidden">
            <span className="text-[8px] opacity-50 font-bold uppercase mb-0.5">{label}</span>
            <span className="text-[11px] font-black truncate">{value}</span>
        </div>
    </div>
)

export default function MediaDetailsLayout({
    data,
    mediaType,
    onAdd,
    loading,
    error,
    isAdded,
    suggestions = [],
    onSelectSuggestion
}: Props) {
    const [activeTab, setActiveTab] = useState<MediaTab>('info')
    const profile = useProfileStore((state) => state.profile)
    const { theme, banner: userBanner } = profile
    const textColor = getContrastColor(theme.background)
    const animeList = useAppStore(state => state.animeList);
    const mangaList = useAppStore(state => state.mangaList);


    // Lógica de Processamento do Trailer
    const trailer = useMemo(() => {
        if (!data || !('trailer' in data)) return null;
        const trailerData = data.trailer as any;
        const id = trailerData?.youtube_id;
        if (!id) return null;

        return {
            id: id,
            url: trailerData?.url || `https://www.youtube.com/watch?v=${id}`,
            thumb: trailerData?.images?.maximum_image_url ||
                trailerData?.images?.large_image_url ||
                `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
        };
    }, [data]);

    const isActuallyAdded = useMemo(() => {
        if (!data) return false;
        const id = data.mal_id;
        return mediaType === 'anime'
            ? animeList.some(a => String(a.id) === String(id))
            : mangaList.some(m => String(m.id) === String(id));
    }, [data, mediaType, animeList, mangaList]);


    // --- TELA DE CARREGAMENTO ---
    if (loading) {
        return (
            <Layout>
                <div className="animate-pulse space-y-4 pt-20 px-4">
                    <div className="h-72 rounded-[2.5rem] bg-zinc-900/50" />
                    <div className="h-10 w-2/3 bg-zinc-900/50 rounded-xl" />
                </div>
            </Layout>
        )
    }

    // --- TELA DE MATCH (SUGESTÕES) ---
    // Exibida quando a busca por nome retorna vários resultados duvidosos
    if (suggestions.length > 0 && !data) {
        return (
            <Layout>
                <div className="pt-24 px-4 max-w-6xl mx-auto">
                    <div className="flex flex-col items-center mb-12 text-center">
                        <div className="p-4 rounded-full mb-6" style={{ backgroundColor: hexToRgba(theme.primary, 0.1) }}>
                            <Search size={32} style={{ color: theme.primary }} />
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter" style={{ color: textColor }}>
                            Vários resultados encontrados
                        </h2>
                        <p className="opacity-50 text-xs font-bold uppercase tracking-widest mt-2" style={{ color: textColor }}>
                            Selecione o anime correto para continuar
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {suggestions.map((item, index) => (
                            <motion.div
                                key={item.mal_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => onSelectSuggestion?.(item.mal_id)}
                                className="group cursor-pointer space-y-3"
                            >
                                <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border shadow-xl transition-all group-hover:scale-105"
                                    style={{ borderColor: hexToRgba(textColor, 0.1) }}>
                                    <img
                                        src={item.images.jpg.large_image_url || item.images.jpg.image_url}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Check size={32} className="text-white" />
                                    </div>
                                </div>
                                <div className="px-1">
                                    <h3 className="text-[11px] font-black uppercase tracking-tight leading-tight line-clamp-2" style={{ color: textColor }}>
                                        {item.title}
                                    </h3>
                                    <p className="text-[9px] opacity-40 font-bold uppercase mt-1" style={{ color: textColor }}>
                                        {(item as any).type} • {(item as any).year || (item as any).status}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </Layout>
        )
    }

    // --- TELA DE ERRO ---
    if (error || !data) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-40">
                    <p className="font-bold uppercase tracking-widest text-xs" style={{ color: theme.primary }}>
                        Mídia não encontrada
                    </p>
                    <button
                        onClick={() => window.history.back()}
                        className="mt-4 text-[10px] font-black uppercase opacity-50 hover:opacity-100 transition-opacity"
                        style={{ color: textColor }}
                    >
                        Voltar para o início
                    </button>
                </div>
            </Layout>
        )
    }

    // --- VARIÁVEIS DE DADOS ---
    const cover = data.images.jpg.large_image_url || data.images.jpg.image_url
    const score = data.score
    const rank = data.rank
    const status = (data as any).status
    const episodes = 'episodes' in data ? data.episodes : (data as any).chapters || null

    return (
        <Layout>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative -mx-4 sm:-mx-6 -mt-6 mb-12 overflow-hidden"
            >
                {/* Banner Background */}
                <div className="absolute inset-0 h-[550px] sm:h-[450px]">
                    <img
                        src={userBanner || cover}
                        alt=""
                        className="w-full h-full object-cover blur-2xl scale-110 opacity-30"
                    />
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `linear-gradient(to bottom, transparent, ${theme.background})`
                        }}
                    />
                </div>

                {/* Header Content */}
                <div className="relative pt-24 px-4 sm:px-8">
                    <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-end">
                        <motion.img
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            src={cover}
                            alt={data.title}
                            className="w-48 sm:w-56 rounded-[2.5rem] shadow-2xl border z-10"
                            style={{
                                borderColor: hexToRgba(textColor, 0.1),
                                boxShadow: `0 25px 50px -12px ${hexToRgba(theme.primary, 0.4)}`
                            }}
                        />

                        <div className="pb-4 space-y-6 flex-1 text-center sm:text-left z-10 w-full overflow-hidden">
                            <h1
                                className="text-3xl sm:text-5xl font-black leading-tight tracking-tighter italic uppercase break-words"
                                style={{ color: textColor }}
                            >
                                {data.title}
                            </h1>

                            <div className="grid grid-cols-2 lg:flex lg:flex-wrap justify-center sm:justify-start gap-3">
                                {score && (
                                    <InfoBadge
                                        icon={Star} label="Score" value={score} color="#fbbf24"
                                        themeNavbar={theme.navbar} textColor={textColor}
                                    />
                                )}
                                {rank && (
                                    <InfoBadge
                                        icon={Trophy} label="Ranking" value={`#${rank}`} color={theme.primary}
                                        themeNavbar={theme.navbar} textColor={textColor}
                                    />
                                )}
                                {episodes && (
                                    <InfoBadge
                                        icon={Tv} label={'episodes' in data ? "Episódios" : "Capítulos"} value={episodes}
                                        themeNavbar={theme.navbar} textColor={textColor}
                                    />
                                )}
                                {status && (
                                    <InfoBadge
                                        icon={Activity} label="Status" value={status}
                                        themeNavbar={theme.navbar} textColor={textColor}
                                    />
                                )}
                            </div>

                            <button
                                // Usamos a nossa variável reativa aqui
                                disabled={isActuallyAdded}
                                onClick={onAdd}
                                className="mt-2 w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl px-8 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                                style={{
                                    backgroundColor: isActuallyAdded ? hexToRgba(theme.primary, 0.1) : theme.primary,
                                    color: isActuallyAdded ? theme.primary : getContrastColor(theme.primary),
                                    border: isActuallyAdded ? `1px solid ${hexToRgba(theme.primary, 0.2)}` : 'none',
                                    boxShadow: isActuallyAdded ? 'none' : `0 10px 30px -10px ${hexToRgba(theme.primary, 0.5)}`,
                                    cursor: isActuallyAdded ? 'default' : 'pointer' // Adicionado para melhor UX
                                }}
                            >
                                {isActuallyAdded ? <Check size={18} /> : <Plus size={18} />}
                                {isActuallyAdded ? 'Na biblioteca' : 'Adicionar'}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Tabs Navigation */}
            <div
                className="flex gap-2 mb-10 overflow-x-auto no-scrollbar border-b pb-px sticky top-16 z-20 backdrop-blur-md"
                style={{
                    borderColor: hexToRgba(textColor, 0.1),
                    backgroundColor: hexToRgba(theme.background, 0.8)
                }}
            >
                {tabs.map((tab) => {
                    const active = activeTab === tab.key
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`relative px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap
                            ${active ? '' : 'opacity-40 hover:opacity-100'}`}
                            style={{ color: textColor }}
                        >
                            {tab.label}
                            {active && (
                                <motion.div
                                    layoutId="tab-indicator"
                                    className="absolute inset-x-0 bottom-0 h-0.5"
                                    style={{
                                        backgroundColor: theme.primary,
                                        boxShadow: `0 -4px 10px ${hexToRgba(theme.primary, 0.5)}`
                                    }}
                                />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px] pb-20 px-1">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'info' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: theme.primary }} />
                                        <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: textColor }}>
                                            Trailer Oficial
                                        </h3>
                                    </div>

                                    {trailer ? (
                                        <motion.div
                                            whileTap={{ scale: 0.98 }}
                                            className="relative aspect-video overflow-hidden rounded-[2.5rem] border bg-zinc-900 shadow-2xl group cursor-pointer"
                                            style={{ borderColor: hexToRgba(textColor, 0.1) }}
                                            onClick={() => window.open(trailer.url, '_blank')}
                                        >
                                            <img
                                                src={trailer.thumb}
                                                className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500"
                                                alt="Trailer Thumbnail"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${trailer.id}/hqdefault.jpg`;
                                                }}
                                            />

                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                                <div
                                                    className="w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-red-600 group-hover:border-red-600 shadow-2xl"
                                                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                                                >
                                                    <Youtube size={40} color="white" fill="white" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Assistir Trailer</p>
                                                    <p className="text-[8px] font-bold uppercase tracking-widest text-white/40">YouTube</p>
                                                </div>
                                            </div>

                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                                style={{ background: `radial-gradient(circle at center, ${hexToRgba(theme.primary, 0.15)} 0%, transparent 70%)` }}
                                            />
                                        </motion.div>
                                    ) : (
                                        <div
                                            className="aspect-video flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed gap-4"
                                            style={{
                                                borderColor: hexToRgba(textColor, 0.1),
                                                color: hexToRgba(textColor, 0.3)
                                            }}
                                        >
                                            <Youtube size={32} className="opacity-20" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Trailer Indisponível</span>
                                        </div>
                                    )}
                                </div>

                                <div className="lg:col-span-1">
                                    <div
                                        className="backdrop-blur-md border rounded-[2.5rem] p-6 sm:p-8 lg:sticky lg:top-32"
                                        style={{
                                            backgroundColor: hexToRgba(theme.navbar, 0.4),
                                            borderColor: hexToRgba(textColor, 0.05)
                                        }}
                                    >
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6" style={{ color: theme.primary }}>
                                            Sinopse e Gêneros
                                        </h3>
                                        <MediaInfoTab data={data} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'episodes' && (
                            <div className="border rounded-[2.5rem] p-6 sm:p-8 shadow-2xl bg-zinc-900/10" style={{ borderColor: hexToRgba(textColor, 0.05) }}>
                                <MediaEpisodesTab
                                    animeId={Number(data.mal_id)}
                                    mediaType={'episodes' in data ? 'anime' : 'manga'}
                                    animeTitle={data.title}
                                />
                            </div>
                        )}

                        {activeTab === 'characters' && (
                            <div className="border rounded-[2.5rem] p-6 sm:p-8 shadow-2xl bg-zinc-900/10" style={{ borderColor: hexToRgba(textColor, 0.05) }}>
                                <MediaCharactersTab />
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="max-w-3xl mx-auto px-2">
                                <MediaReviewsTab />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </Layout>
    )
}