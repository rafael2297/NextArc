import { Plus, Check, AlertTriangle, Star, Trophy } from 'lucide-react'
import type { MouseEvent } from 'react'

import BaseMediaCard from './BaseMediaCard'
import { useSessionStore } from '../../store/useSessionStore'
import { useProfileStore } from '../../store/useProfileStore'
import { isNSFW } from '../../utils/isNSFW'
import { hexToRgba, getContrastColor } from '../../utils/colors'

import type {
    AnimeStatus,
    ReadingStatus,
} from '../../store/useAppStore'

interface SearchMediaCardProps {
    id: number
    title: string
    image: string
    type: 'anime' | 'manga'
    score?: number
    rank?: number
    format?: string

    /** 🔞 dados para NSFW */
    rating?: string | null
    genres?: { mal_id: number; name: string }[]
    explicit_genres?: { mal_id: number; name: string }[]

    onAdd: (isNSFW: boolean) => void
    isAdded: boolean
    existingStatus?: AnimeStatus | ReadingStatus
}

const statusLabel: Record<string, string> = {
    watching: 'Assistindo',
    reading: 'Lendo',
    completed: 'Concluído',
    paused: 'Pausado',
    dropped: 'Abandonado',
    planned: 'Planejado',
}

export default function SearchAnimeMangaCard({
    id,
    title,
    image,
    type,
    score,
    rank,
    format,
    rating,
    genres,
    explicit_genres,
    onAdd,
    isAdded,
    existingStatus,
}: SearchMediaCardProps) {
    const nsfwMode = useSessionStore(s => s.nsfwMode)
    const theme = useProfileStore((state) => state.profile.theme)

    const nsfw = isNSFW({ rating, genres, explicit_genres })
    const blurCard = nsfw && nsfwMode === 'blur'
    const hideCard = nsfw && nsfwMode === 'hide'

    function stop(e: MouseEvent) {
        e.stopPropagation()
        e.preventDefault()
    }

    if (hideCard) return null

    return (
        <BaseMediaCard
            id={id}
            title={title}
            image={image}
            type={type}
            format={format} // <-- PASSANDO PARA O CANTO SUPERIOR DIREITO DO BASE
            disabled={blurCard}
            badge={
                <>
                    {/* AVISO NSFW */}
                    {blurCard && (
                        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-xl rounded-[1.8rem]">
                            <div className="flex flex-col items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-400 text-center p-4">
                                <AlertTriangle size={24} className="mb-1" />
                                <span>Sensível</span>
                            </div>
                        </div>
                    )}

                    {/* GRUPO DE BADGES (Lado Esquerdo) */}
                    {!blurCard && (
                        <div className="flex flex-col gap-1.5">
                            {/* NOTA/SCORE */}
                            {score && score > 0 && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black bg-black/50 text-yellow-400 border border-white/10 backdrop-blur-md shadow-xl">
                                    <Star size={10} fill="currentColor" className="drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                                    <span className="drop-shadow-sm">{score}</span>
                                </div>
                            )}

                            {/* RANK */}
                            {rank && rank > 0 && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black bg-black/50 text-purple-400 border border-white/10 backdrop-blur-md shadow-xl">
                                    <Trophy size={10} className="drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]" />
                                    <span className="drop-shadow-sm">#{rank}</span>
                                </div>
                            )}
                        </div>
                    )}
                </>
            }
            footer={
                isAdded && existingStatus ? (
                    <div
                        onClick={stop}
                        className="flex items-center justify-center gap-2 rounded-2xl py-3 text-[11px] font-black uppercase tracking-wider border transition-all"
                        style={{
                            backgroundColor: hexToRgba('#10b981', 0.1),
                            color: '#10b981',
                            borderColor: hexToRgba('#10b981', 0.2)
                        }}
                    >
                        <Check size={14} strokeWidth={3} />
                        {statusLabel[existingStatus]}
                    </div>
                ) : (
                    <button
                        onClick={(e) => {
                            stop(e)
                            onAdd(nsfw)
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[11px] font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
                        style={{
                            backgroundColor: theme.primary,
                            color: getContrastColor(theme.primary)
                        }}
                    >
                        <Plus size={14} strokeWidth={3} />
                        Adicionar
                    </button>
                )
            }
        />
    )
}