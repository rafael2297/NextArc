import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchMediaReviews } from '../../../services/jikanApi'
import { Quote, MessageSquare, ChevronDown, ChevronUp, Languages, Star } from 'lucide-react'
import { useTranslatedText } from '../../../hooks/useTranslatedText'
import { useProfileStore } from '../../../store/useProfileStore'
import { hexToRgba, getContrastColor } from '../../../utils/colors'

function ReviewCard({ review }: { review: any }) {
    const [isExpanded, setIsExpanded] = useState(false)
    const theme = useProfileStore((state) => state.profile.theme)
    const textColor = getContrastColor(theme.background)

    const {
        text,
        loading,
        isTranslated,
        showOriginal,
        handleTranslate,
    } = useTranslatedText({
        malId: review.mal_id,
        textToTranslate: review.review,
    })

    return (
        <div
            className="group backdrop-blur-md border p-6 sm:p-8 rounded-[2.5rem] transition-all duration-500"
            style={{
                backgroundColor: hexToRgba(theme.navbar, 0.4),
                borderColor: hexToRgba(textColor, 0.05)
            }}
        >
            {/* HEADER DO CARD */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <img
                        src={review.user.images.jpg.image_url}
                        className="w-12 h-12 rounded-2xl object-cover border"
                        style={{ borderColor: hexToRgba(textColor, 0.1) }}
                        alt={review.user.username}
                    />
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-tighter" style={{ color: textColor }}>
                            {review.user.username}
                        </h4>
                        <p className="text-[10px] font-medium opacity-50" style={{ color: textColor }}>
                            {new Date(review.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div
                        className="px-3 py-1.5 rounded-xl border flex items-center gap-1.5"
                        style={{
                            backgroundColor: hexToRgba(theme.primary, 0.1),
                            borderColor: hexToRgba(theme.primary, 0.2)
                        }}
                    >
                        <Star size={10} className="fill-current" style={{ color: theme.primary }} />
                        <span className="text-xs font-black" style={{ color: theme.primary }}>{review.score}/10</span>
                    </div>

                    <button
                        onClick={handleTranslate}
                        disabled={loading}
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-colors"
                        style={{
                            color: isTranslated && !showOriginal ? theme.primary : hexToRgba(textColor, 0.4)
                        }}
                    >
                        <Languages size={12} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Traduzindo...' : (isTranslated && !showOriginal ? 'Ver Original' : 'Traduzir')}
                    </button>
                </div>
            </div>

            {/* CONTEÚDO DA REVIEW */}
            <div className="relative">
                <Quote
                    className="absolute -top-2 -left-2 w-12 h-12 -z-10 opacity-10"
                    style={{ color: theme.primary }}
                />
                <p
                    className={`text-sm leading-relaxed whitespace-pre-wrap transition-all duration-500 ${!isExpanded && 'line-clamp-4'}`}
                    style={{ color: textColor, opacity: 0.8 }}
                >
                    {text}
                </p>
            </div>

            {/* FOOTER DO CARD */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
                    style={{ color: hexToRgba(textColor, 0.5) }}
                >
                    {isExpanded ? (
                        <><ChevronUp size={14} /> Ler menos</>
                    ) : (
                        <><ChevronDown size={14} /> Ler review completa</>
                    )}
                </button>

                <div className="flex items-center gap-2">
                    {review.tags.slice(0, 2).map((tag: string) => (
                        <span
                            key={tag}
                            className="text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border"
                            style={{
                                backgroundColor: hexToRgba(textColor, 0.05),
                                borderColor: hexToRgba(textColor, 0.1),
                                color: hexToRgba(textColor, 0.6)
                            }}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default function MediaReviewsTab() {
    const { type, id } = useParams()
    const [reviews, setReviews] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const theme = useProfileStore((state) => state.profile.theme)

    useEffect(() => {
        let isMounted = true
        fetchMediaReviews(type as any, Number(id))
            .then(data => { if (isMounted) setReviews(data) })
            .finally(() => { if (isMounted) setLoading(false) })
        return () => { isMounted = false }
    }, [type, id])

    if (loading) return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {[...Array(3)].map((_, i) => (
                <div
                    key={i}
                    className="animate-pulse rounded-[2.5rem] h-56 border border-white/5"
                    style={{ backgroundColor: hexToRgba(theme.navbar, 0.5) }}
                />
            ))}
        </div>
    )

    if (!reviews?.length) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-20">
            <MessageSquare size={40} strokeWidth={1} style={{ color: theme.primary }} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Sem reviews para exibir</p>
        </div>
    )

    return (
        <div className="space-y-8 max-w-3xl mx-auto pb-10">
            {reviews.slice(0, 10).map((review) => (
                <ReviewCard key={review.mal_id} review={review} />
            ))}
        </div>
    )
}