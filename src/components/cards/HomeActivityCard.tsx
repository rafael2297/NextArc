import { Calendar, PlayCircle, BookOpen } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '../../store/useProfileStore'
import { hexToRgba, getContrastColor, getBorderColor } from '../../utils/colors'

interface HomeActivityCardProps {
    id: number
    title: string
    image: string
    type: 'anime' | 'manga'
    addedAt: number
    format?: string
}

export default function HomeActivityCard({
    id,
    title,
    image,
    type,
    addedAt,
    format,
}: HomeActivityCardProps) {
    const navigate = useNavigate()
    const theme = useProfileStore((state) => state.profile.theme)

    // Definição de cores baseada no tipo real da mídia
    const isAnime = type === 'anime'
    const accentColor = isAnime ? theme.primary : '#10b981'

    const textColor = getContrastColor(theme.navbar)
    const subTextColor = hexToRgba(textColor, 0.5)
    const borderColor = getBorderColor(theme.background)

    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(addedAt))

    return (
        <div
            onClick={() => navigate(`/media/${type}/${id}`)}
            className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 shadow-lg cursor-pointer border h-full"
            style={{
                backgroundColor: theme.navbar,
                borderColor: borderColor
            }}
        >
            {/* ÁREA DA IMAGEM */}
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

                {/* BADGE DE DATA (Canto Superior Esquerdo) */}
                <div
                    className="absolute top-3 left-3 z-20 px-2 py-1 rounded-lg text-[9px] font-black bg-black/60 text-white border border-white/10 backdrop-blur-md flex items-center gap-1.5"
                >
                    <Calendar size={10} />
                    {formattedDate}
                </div>

                {/* BADGE DE FORMATO DINÂMICO (Canto Superior Direito) */}
                <div
                    className="absolute top-3 right-3 z-20 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md border"
                    style={{
                        backgroundColor: hexToRgba(theme.background, 0.7),
                        color: accentColor,
                        borderColor: hexToRgba(accentColor, 0.3)
                    }}
                >
                    {isAnime ? <PlayCircle size={12} /> : <BookOpen size={12} />}
                    {/* Exibe o formato (TV, Movie, etc) ou o tipo (Anime/Manga) como fallback */}
                    {format ? format.replace(/_/g, ' ') : type}
                </div>
            </div>

            {/* INFO DO CARD */}
            <div className="p-4 space-y-2 flex-1 flex flex-col">
                <h3
                    className="text-sm font-bold line-clamp-2 min-h-[40px] leading-tight transition-colors"
                    style={{ color: textColor }}
                >
                    <span className="group-hover:opacity-70 transition-opacity">
                        {title}
                    </span>
                </h3>

                <div
                    className="flex items-center gap-2 border-t pt-2 mt-auto"
                    style={{ borderColor: hexToRgba(textColor, 0.1) }}
                >
                    <span
                        className="text-[9px] font-black uppercase tracking-widest opacity-60"
                        style={{ color: subTextColor }}
                    >
                        Adicionado recentemente
                    </span>
                </div>
            </div>

            {/* Efeito de Hover Dinâmico */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .group:hover {
                    border-color: ${hexToRgba(accentColor, 0.5)} !important;
                    box-shadow: 0 10px 25px -5px ${hexToRgba(accentColor, 0.2)};
                }
            `}} />
        </div>
    )
}