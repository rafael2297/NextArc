import { useEffect, useState, useMemo } from 'react'
import { Tv, AlertCircle, Loader2, ChevronDown } from 'lucide-react' // Adicionado ChevronDown
import { useProfileStore } from '../../../store/useProfileStore'
import { hexToRgba, getContrastColor } from '../../../utils/colors'
import VideoPlayer from '../../../components/shared/VideoPlayer'
import { useAppStore } from '../../../store/useAppStore'
import { useToast } from '../../../components/toast/useToast';

interface Episode {
    title: string
    link: string
    img: string
    provider: string
    season?: number
}

interface Props {
    animeId: number
    mediaType: string
    animeTitle: string
}

function normalizeTitle(title: string) {
    return title
        .replace(/\(.*?\)/g, '')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

export default function MediaEpisodesTab({
    animeId,
    mediaType,
    animeTitle
}: Props) {
    const [episodes, setEpisodes] = useState<Episode[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    // ESTADO PARA TEMPORADAS ABERTAS (Inicia com a Temporada 1 aberta)
    const [openSeasons, setOpenSeasons] = useState<Record<number, boolean>>({ 1: true })

    const [currentIndex, setCurrentIndex] = useState<number | null>(null)
    const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null)
    const [isExtracting, setIsExtracting] = useState(false)

    const updateProgress = useAppStore((s) => s.updateProgress)
    const theme = useProfileStore((s) => s.profile.theme)
    const textColor = getContrastColor(theme.background)

    const { showToast } = useToast();


    useEffect(() => {
        const fetchEpisodes = async () => {
            setLoading(true)
            setError(false)
            const attempts = [animeTitle, normalizeTitle(animeTitle)]

            try {
                for (const q of attempts) {
                    const res = await fetch(`http://127.0.0.1:3000/api/search?q=${encodeURIComponent(q)}`)

                    if (!res.ok) continue
                    const data = await res.json()

                    if (!Array.isArray(data) || data.length === 0) continue

                    const valid = data.filter((ep) => ep?.link && ep?.provider)
                    if (valid.length === 0) continue

                    valid.sort((a, b) => {
                        if (a.season !== b.season) return (a.season || 1) - (b.season || 1)
                        const na = parseInt(a.title.replace(/\D/g, '')) || 0
                        const nb = parseInt(b.title.replace(/\D/g, '')) || 0
                        return na - nb
                    })

                    setEpisodes(valid)
                    setLoading(false)
                    return
                }
                setError(true)
            } catch (err) {
                console.error('[EpisodesTab] erro:', err)
                setError(true)
            } finally {
                setLoading(false)
            }
        }
        fetchEpisodes()
    }, [animeTitle])

    const playEpisode = async (index: number) => {
        const ep = episodes[index];
        if (!ep) return;

        setIsExtracting(true);
        try {
            // Adicionamos t=${Date.now()} para evitar cache do navegador
            const res = await fetch(
                `http://127.0.0.1:3000/api/video?url=${encodeURIComponent(ep.link)}&provider=${ep.provider}&t=${Date.now()}`
            );

            const data = await res.json();
            console.log("Resposta do Servidor:", data);

            // Verifica se data.url existe de fato
            if (data && data.url) {
                setSelectedVideoUrl(data.url);
                setCurrentIndex(index);

                const epNum = ep.title.match(/\d+/)?.[0];
                if (epNum) {
                    updateProgress(animeId, Number(epNum), mediaType === 'manga' ? 'manga' : 'anime', ep.season || 1);
                }
            } else {
                showToast('O provedor não liberou o player. O link pode ter expirado.', 'warning');
            }
        } catch (e) {
            console.error('Erro:', e);
            showToast('Erro ao conectar com o servidor de vídeo.', 'error');
        } finally {
            setIsExtracting(false);
        }
    };

    const episodesBySeason = useMemo(() => {
        const acc: Record<number, Episode[]> = {};
        episodes.forEach((ep) => {
            const s = Number(ep.season) || 1;
            if (!acc[s]) acc[s] = [];
            acc[s].push(ep);
        });
        return acc;
    }, [episodes]);

    // Função para alternar colapso
    const toggleSeason = (season: number) => {
        setOpenSeasons(prev => ({
            ...prev,
            [season]: !prev[season]
        }))
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: theme.primary }} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style={{ color: textColor }}>Sincronizando Provedores...</span>
        </div>
    )

    if (error || episodes.length === 0) return (
        <div className="flex flex-col items-center justify-center py-16 px-6 rounded-[2.5rem] border-2 border-dashed" style={{ borderColor: hexToRgba(textColor, 0.05), color: hexToRgba(textColor, 0.4) }}>
            <AlertCircle size={32} className="mb-4 opacity-20" />
            <p className="text-xs font-black uppercase tracking-widest text-center">Nenhum episódio encontrado</p>
        </div>
    )

    return (
        <div className="space-y-4"> {/* Diminuí o espaçamento geral */}
            {Object.keys(episodesBySeason)
                .map(Number)
                .sort((a, b) => a - b)
                .map((season) => {
                    const isOpen = !!openSeasons[season];

                    return (
                        <div key={season} className="overflow-hidden">
                            {/* HEADER COLAPSÁVEL */}
                            <button
                                onClick={() => toggleSeason(season)}
                                className="w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98]"
                                style={{
                                    backgroundColor: hexToRgba(textColor, 0.03),
                                    color: textColor
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: hexToRgba(theme.primary, 0.1) }}>
                                        <Tv size={14} style={{ color: theme.primary }} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest">
                                        Temporada {season}
                                    </span>
                                    <span className="text-[10px] opacity-40 font-bold">
                                        ({episodesBySeason[season].length} EPISÓDIOS)
                                    </span>
                                </div>
                                <ChevronDown
                                    size={18}
                                    className={`transition-transform duration-300 opacity-30 ${isOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {/* GRID DE EPISÓDIOS (ANIMADO POR CSS) */}
                            <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0'}`}>
                                <div className="overflow-hidden">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {episodesBySeason[season].map((ep) => {
                                            const globalIndex = episodes.indexOf(ep)
                                            return (
                                                <button
                                                    key={`${ep.link}-${globalIndex}`}
                                                    onClick={() => playEpisode(globalIndex)}
                                                    className="flex items-center gap-4 p-3 rounded-xl border transition-all hover:scale-[1.02] active:scale-95"
                                                    style={{ backgroundColor: hexToRgba(theme.background, 0.5), borderColor: hexToRgba(textColor, 0.1) }}
                                                >
                                                    <img src={ep.img} alt={ep.title} className="w-24 h-16 rounded-lg object-cover bg-neutral-900" />
                                                    <div className="text-left">
                                                        <p className="text-[9px] font-bold uppercase opacity-40 tracking-tighter">{ep.provider}</p>
                                                        <p className="font-bold text-sm line-clamp-1" style={{ color: textColor }}>{ep.title}</p>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}

            {isExtracting && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-white" size={40} />
                        <span className="text-white text-[10px] font-black uppercase tracking-widest">Extraindo Link...</span>
                    </div>
                </div>
            )}

            {selectedVideoUrl && currentIndex !== null && (
                <VideoPlayer
                    url={selectedVideoUrl}
                    title={episodes[currentIndex].title}
                    onClose={() => {
                        setSelectedVideoUrl(null)
                        setCurrentIndex(null)
                    }}
                />
            )}
        </div>
    )
}