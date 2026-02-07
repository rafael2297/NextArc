import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, Star, Trophy } from 'lucide-react'

import Layout from '../../components/layout/Layout'
import { useProfileStore } from '../../store/useProfileStore'
import { hexToRgba, getContrastColor } from '../../utils/colors'

import type {
    MediaType,
    JikanAnime,
    JikanManga,
} from '../../services/jikanApi'

import MediaInfoTab from './tabs/MediaInfoTab'
import MediaCharactersTab from './tabs/MediaCharactersTab'
import MediaReviewsTab from './tabs/MediaReviewsTab'

type MediaData = JikanAnime | JikanManga
type MediaTab = 'info' | 'characters' | 'reviews'

interface Props {
    loading: boolean
    error: boolean
    data: MediaData | null
    mediaType: MediaType
    isAdded: boolean
    onAdd: () => void
}

const tabs: { key: MediaTab; label: string }[] = [
    { key: 'info', label: 'Informações' },
    { key: 'characters', label: 'Personagens' },
    { key: 'reviews', label: 'Reviews' },
]

export default function MediaDetailsLayout({
    loading,
    error,
    data,
    isAdded,
    onAdd,
}: Props) {
    const [activeTab, setActiveTab] = useState<MediaTab>('info')

    const profile = useProfileStore((state) => state.profile)
    const { theme, banner: userBanner } = profile
    const textColor = getContrastColor(theme.background)

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

    if (error || !data) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center py-20">
                    <p className="font-bold uppercase tracking-widest text-xs" style={{ color: theme.primary }}>
                        Erro ao carregar mídia
                    </p>
                </div>
            </Layout>
        )
    }

    const cover = data.images.jpg.large_image_url || data.images.jpg.image_url
    const trailerUrl = 'trailer' in data && data.trailer?.embed_url
        ? `${data.trailer.embed_url}?autoplay=0&rel=0`
        : null

    return (
        <Layout>
            {/* HERO HEADER */}
            {/* O overflow-hidden aqui impede que margens negativas causem scroll horizontal */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative -mx-4 sm:-mx-6 -mt-6 mb-12 overflow-hidden"
            >
                {/* Banner Background */}
                <div className="absolute inset-0 h-[450px]">
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

                <div className="relative pt-24 px-4 sm:px-8">
                    <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-end">
                        {/* Poster */}
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

                        <div className="pb-4 space-y-4 flex-1 text-center sm:text-left z-10">
                            <h1
                                className="text-3xl sm:text-5xl font-black leading-none tracking-tighter italic uppercase"
                                style={{ color: textColor }}
                            >
                                {data.title}
                            </h1>

                            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs font-black uppercase tracking-widest">
                                {data.score && (
                                    <span
                                        className="flex items-center gap-1.5 backdrop-blur-md px-3 py-1.5 rounded-xl border"
                                        style={{
                                            backgroundColor: hexToRgba(theme.navbar, 0.8),
                                            borderColor: hexToRgba(textColor, 0.05),
                                            color: '#fbbf24'
                                        }}
                                    >
                                        <Star size={14} className="fill-amber-400" /> {data.score}
                                    </span>
                                )}
                                {data.rank && (
                                    <span
                                        className="flex items-center gap-1.5 backdrop-blur-md px-3 py-1.5 rounded-xl border"
                                        style={{
                                            backgroundColor: hexToRgba(theme.navbar, 0.8),
                                            borderColor: hexToRgba(textColor, 0.05),
                                            color: theme.primary
                                        }}
                                    >
                                        <Trophy size={14} /> #{data.rank}
                                    </span>
                                )}
                            </div>

                            <button
                                disabled={isAdded}
                                onClick={onAdd}
                                className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl px-8 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                                style={{
                                    backgroundColor: isAdded ? hexToRgba(theme.primary, 0.1) : theme.primary,
                                    color: isAdded ? theme.primary : getContrastColor(theme.primary),
                                    border: isAdded ? `1px solid ${hexToRgba(theme.primary, 0.2)}` : 'none',
                                    boxShadow: isAdded ? 'none' : `0 10px 30px -10px ${hexToRgba(theme.primary, 0.5)}`
                                }}
                            >
                                {isAdded ? <Check size={18} /> : <Plus size={18} />}
                                {isAdded ? 'Na biblioteca' : 'Adicionar'}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* TABS NAVIGATION */}
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

            {/* CONTENT AREA */}
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

                                    {trailerUrl ? (
                                        <div
                                            className="aspect-video overflow-hidden rounded-[2.5rem] border bg-black shadow-2xl"
                                            style={{ borderColor: hexToRgba(textColor, 0.05) }}
                                        >
                                            <iframe src={trailerUrl} className="w-full h-full" loading="lazy" allowFullScreen />
                                        </div>
                                    ) : (
                                        <div
                                            className="aspect-video flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed gap-4"
                                            style={{
                                                borderColor: hexToRgba(textColor, 0.1),
                                                color: hexToRgba(textColor, 0.3)
                                            }}
                                        >
                                            <Plus size={24} className="rotate-45" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Vídeo Indisponível</span>
                                        </div>
                                    )}
                                </div>

                                <div className="lg:col-span-1">
                                    <div
                                        className="backdrop-blur-md border rounded-[2.5rem] p-6 sm:p-8 sticky top-32"
                                        style={{
                                            backgroundColor: hexToRgba(theme.navbar, 0.4),
                                            borderColor: hexToRgba(textColor, 0.05)
                                        }}
                                    >
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6" style={{ color: theme.primary }}>
                                            Ficha Técnica
                                        </h3>
                                        <MediaInfoTab data={data} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'characters' && (
                            <div
                                className="border rounded-[2.5rem] p-6 sm:p-8 shadow-2xl"
                                style={{
                                    backgroundColor: hexToRgba(theme.navbar, 0.2),
                                    borderColor: hexToRgba(textColor, 0.05)
                                }}
                            >
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