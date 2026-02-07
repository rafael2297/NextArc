import type {
    JikanAnime,
    JikanManga,
    JikanTag
} from '../../../services/jikanApi'
import { useTranslatedText } from '../../../hooks/useTranslatedText'
import { Languages, Info, Star, Hash, PlayCircle, BookOpen } from 'lucide-react'
import { useProfileStore } from '../../../store/useProfileStore'
import { hexToRgba, getContrastColor } from '../../../utils/colors'

interface Props {
    data: JikanAnime | JikanManga
}

type TagType = 'genre' | 'theme' | 'demographic'

interface TagWithType extends JikanTag {
    type: TagType
}

export default function MediaInfoTab({ data }: Props) {
    // Acessando o tema global
    const theme = useProfileStore((state) => state.profile.theme)
    const textColor = getContrastColor(theme.background)

    const {
        text,
        loading,
        isTranslated,
        showOriginal,
        handleTranslate,
    } = useTranslatedText({
        malId: data.mal_id,
        textToTranslate: data.synopsis,
    })

    const tags: TagWithType[] = [
        ...data.genres.map((g): TagWithType => ({ ...g, type: 'genre' })),
        ...data.themes.map((t): TagWithType => ({ ...t, type: 'theme' })),
        ...data.demographics.map((d): TagWithType => ({ ...d, type: 'demographic' })),
    ]

    // Cores das Tags baseadas no tema
    const getTagStyle = (type: TagType) => {
        switch (type) {
            case 'genre':
                return {
                    backgroundColor: hexToRgba(theme.primary, 0.1),
                    color: theme.primary,
                    borderColor: hexToRgba(theme.primary, 0.2)
                }
            case 'theme':
                return {
                    backgroundColor: hexToRgba('#10b981', 0.1), // Emerald 
                    color: '#10b981',
                    borderColor: hexToRgba('#10b981', 0.2)
                }
            case 'demographic':
                return {
                    backgroundColor: hexToRgba('#f59e0b', 0.1), // Amber
                    color: '#f59e0b',
                    borderColor: hexToRgba('#f59e0b', 0.2)
                }
            default:
                return {
                    backgroundColor: hexToRgba(textColor, 0.05),
                    color: hexToRgba(textColor, 0.6),
                    borderColor: hexToRgba(textColor, 0.1)
                }
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* TAGS */}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {tags.map(tag => {
                        const style = getTagStyle(tag.type)
                        return (
                            <span
                                key={`${tag.type}-${tag.mal_id}`}
                                className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all"
                                style={style}
                            >
                                {tag.name}
                            </span>
                        )
                    })}
                </div>
            )}

            {/* SINOPSE */}
            <div
                className="relative group p-6 rounded-[2rem] border transition-all"
                style={{
                    backgroundColor: hexToRgba(theme.navbar, 0.3),
                    borderColor: hexToRgba(textColor, 0.05)
                }}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 opacity-50" style={{ color: textColor }}>
                        <Info size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sinopse</span>
                    </div>

                    <button
                        onClick={handleTranslate}
                        disabled={loading}
                        className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all px-3 py-1.5 rounded-lg border"
                        style={{
                            backgroundColor: isTranslated && !showOriginal ? hexToRgba(theme.primary, 0.1) : 'transparent',
                            borderColor: isTranslated && !showOriginal ? hexToRgba(theme.primary, 0.2) : hexToRgba(textColor, 0.1),
                            color: isTranslated && !showOriginal ? theme.primary : textColor
                        }}
                    >
                        <Languages size={12} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Traduzindo...' : (isTranslated && !showOriginal ? 'Ver Original' : 'Traduzir')}
                    </button>
                </div>

                <p
                    className="text-sm leading-relaxed whitespace-pre-wrap font-medium opacity-80"
                    style={{ color: textColor }}
                >
                    {text || 'Nenhuma sinopse disponível.'}
                </p>
            </div>

            {/* GRID DE INFOS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    {
                        label: 'Score',
                        value: data.score ?? 'N/A',
                        icon: <Star size={12} className="fill-amber-500 text-amber-500" />
                    },
                    {
                        label: 'Ranking',
                        value: data.rank ? `#${data.rank}` : 'N/A',
                        icon: <Hash size={12} style={{ color: theme.primary }} />
                    },
                    {
                        label: 'episodes' in data ? 'Episódios' : 'Capítulos',
                        value: ('episodes' in data ? data.episodes : (data as JikanManga).chapters) ?? '?',
                        icon: 'episodes' in data ? <PlayCircle size={12} /> : <BookOpen size={12} />
                    },
                    {
                        label: 'Status',
                        value: (data as any).status ?? 'Desconhecido',
                        icon: <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.primary }} />
                    }
                ].map((item, idx) => (
                    <div
                        key={idx}
                        className="p-4 rounded-2xl border transition-all"
                        style={{
                            backgroundColor: hexToRgba(theme.navbar, 0.4),
                            borderColor: hexToRgba(textColor, 0.05)
                        }}
                    >
                        <div className="flex items-center gap-2 mb-1 opacity-50" style={{ color: textColor }}>
                            {item.icon}
                            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
                        </div>
                        <p className="text-lg font-black" style={{ color: textColor }}>{item.value}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}