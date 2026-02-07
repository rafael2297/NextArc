import { Plus, Star, Trophy, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { MouseEvent } from 'react'
import { useProfileStore } from '../../store/useProfileStore'
import { hexToRgba, getContrastColor, getBorderColor } from '../../utils/colors'

interface SeasonalAnimeCardProps {
    id: number
    title: string
    image: string
    score?: number
    rank?: number
    isAdded: boolean
    onAdd: () => void
}

export default function SeasonalAnimeCard({
    id,
    title,
    image,
    score,
    rank,
    isAdded,
    onAdd,
}: SeasonalAnimeCardProps) {
    const navigate = useNavigate()

    const theme = useProfileStore((state) => state.profile.theme)
    const textColor = getContrastColor(theme.background)
    const subTextColor = hexToRgba(textColor, 0.6)
    const borderColor = getBorderColor(theme.background)
    const contrastOnPrimary = getContrastColor(theme.primary)

    function goToAnime() {
        navigate(`/media/anime/${id}`)
    }

    function stop(e: MouseEvent) {
        e.stopPropagation()
    }

    return (
        <div
            onClick={goToAnime}
            className="group w-full max-w-[220px] sm:max-w-[240px] lg:max-w-[260px] mx-auto rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer border hover:scale-[1.02]"
            style={{
                backgroundColor: hexToRgba(theme.navbar, 0.4),
                borderColor: borderColor
            }}
        >
            <div
                className="relative aspect-[3/4] p-2 overflow-hidden"
                style={{ backgroundColor: hexToRgba(theme.background, 0.2) }}
            >
                <img
                    src={image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-150"
                />

                <img
                    src={image}
                    alt={title}
                    className="relative z-10 w-full h-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-110 shadow-lg"
                />

                {/* BADGES COM CONTRASTE REFORÇADO */}
                <div className="absolute top-4 left-3 z-20 flex flex-col gap-2">
                    {score && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black bg-black/40 text-yellow-400 border border-white/10 backdrop-blur-md shadow-2xl">
                            <Star size={10} fill="currentColor" className="drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" />
                            <span className="drop-shadow-md">{score}</span>
                        </div>
                    )}
                    {rank && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black bg-black/40 text-purple-400 border border-white/10 backdrop-blur-md shadow-2xl">
                            <Trophy size={10} className="drop-shadow-[0_0_5px_rgba(192,132,252,0.5)]" />
                            <span className="drop-shadow-md">#{rank}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 space-y-4">
                <h3
                    className="text-[13px] font-black uppercase italic tracking-tight line-clamp-2 min-h-[34px] leading-tight"
                    style={{ color: textColor }}
                >
                    {title}
                </h3>

                <button
                    disabled={isAdded}
                    onClick={(e) => {
                        stop(e)
                        onAdd()
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 disabled:opacity-50 active:scale-95 border"
                    style={{
                        backgroundColor: isAdded ? 'transparent' : theme.primary,
                        color: isAdded ? subTextColor : contrastOnPrimary,
                        borderColor: isAdded ? borderColor : 'transparent',
                        boxShadow: isAdded ? 'none' : `0 10px 20px ${hexToRgba(theme.primary, 0.2)}`
                    }}
                >
                    {isAdded ? (
                        <>
                            <Check size={14} strokeWidth={3} />
                            <span>Na Lista</span>
                        </>
                    ) : (
                        <>
                            <Plus size={14} strokeWidth={3} />
                            <span>Adicionar</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}