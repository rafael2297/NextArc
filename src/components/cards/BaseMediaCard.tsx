import { Link } from 'react-router-dom'
import { PlayCircle, BookOpen } from 'lucide-react'
import { useProfileStore } from '../../store/useProfileStore'
import { hexToRgba, getContrastColor, getBorderColor } from '../../utils/colors'

interface BaseMediaCardProps {
    id: number
    title: string
    image: string
    type: 'anime' | 'manga'
    badge?: React.ReactNode
    footer?: React.ReactNode
    disabled?: boolean
    format?: string
}

export default function BaseMediaCard({
    id,
    title,
    image,
    type,
    badge,
    footer,
    disabled = false,
    format,
}: BaseMediaCardProps) {
    const theme = useProfileStore((state) => state.profile.theme)

    const textColor = getContrastColor(theme.navbar)
    const subTextColor = hexToRgba(textColor, 0.5)
    const borderColor = getBorderColor(theme.background)

    const CardContent = (
        <div
            className={`group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 shadow-lg border h-full ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                }`}
            style={{
                backgroundColor: theme.navbar,
                borderColor: borderColor
            }}
        >
            {/* ÁREA DA IMAGEM (Baseada no HomeActivityCard) */}
            <div className="relative aspect-[2/3] w-full flex items-center justify-center overflow-hidden bg-black/20">
                {/* Background Blur da Capa */}
                <img
                    src={image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30"
                />

                {/* Capa Principal */}
                <img
                    src={image}
                    alt={title}
                    className="relative z-10 max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105 shadow-2xl"
                />

                {/* Slot para Badges Dinâmicos (Score/Rank/NSFW) - Lado Esquerdo */}
                <div className="absolute top-3 left-3 z-30 flex flex-col gap-1.5">
                    {badge}
                </div>

                {/* BADGE DE FORMATO (Substituindo o fixo Anime/Manga) - Lado Direito */}
                {format && (
                    <div
                        className="absolute top-3 right-3 z-30 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md border"
                        style={{
                            backgroundColor: hexToRgba(theme.background, 0.7),
                            color: theme.primary,
                            borderColor: hexToRgba(theme.primary, 0.3)
                        }}
                    >
                        {type === 'anime' ? <PlayCircle size={12} /> : <BookOpen size={12} />}
                        {format.replace(/_/g, ' ')}
                    </div>
                )}
            </div>

            {/* INFO DO CARD */}
            <div className="p-4 flex-1 flex flex-col gap-3">
                <h3
                    className="text-sm font-bold line-clamp-2 min-h-[40px] transition-colors leading-tight"
                    style={{ color: textColor }}
                >
                    <span className="group-hover:opacity-70 transition-opacity">
                        {title}
                    </span>
                </h3>

                {/* Slot para o botão "Adicionar" ou Status */}
                {footer && (
                    <div className="mt-auto w-full">
                        {footer}
                    </div>
                )}
            </div>

            {/* Efeito de Hover Dinâmico */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .group:hover {
                    border-color: ${hexToRgba(theme.primary, 0.5)} !important;
                    box-shadow: 0 10px 25px -5px ${hexToRgba(theme.primary, 0.2)};
                }
            `}} />
        </div>
    )

    const wrapperClass = "block w-full transition-transform active:scale-95"

    return disabled ? (
        <div className={wrapperClass}>{CardContent}</div>
    ) : (
        <Link to={`/media/${type}/${id}`} className={wrapperClass}>
            {CardContent}
        </Link>
    )
}