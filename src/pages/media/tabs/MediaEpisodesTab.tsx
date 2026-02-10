import { useEffect, useState } from 'react'
import { Play, Tv, AlertCircle, Loader2 } from 'lucide-react'
import { useProfileStore } from '../../../store/useProfileStore'
import { hexToRgba, getContrastColor } from '../../../utils/colors'
import VideoPlayer from '../../../components/shared/VideoPlayer'
import { useAppStore } from '../../../store/useAppStore';


interface Episode {
    animeId: number;
    mediaType: string;
    title: string
    link: string
    img: string
    provider: string
}

interface Props {
    animeId: number
    mediaType: string
    animeTitle: string
}

export default function MediaEpisodesTab({ animeId, mediaType, animeTitle }: Props) {
    const [episodes, setEpisodes] = useState<Episode[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const updateProgress = useAppStore((state) => state.updateProgress);
    // Estados para o Player
    const [currentIndex, setCurrentIndex] = useState<number | null>(null)
    const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null)
    const [isExtracting, setIsExtracting] = useState(false)

    const theme = useProfileStore((state) => state.profile.theme)
    const textColor = getContrastColor(theme.background)

    useEffect(() => {
        const fetchEpisodes = async () => {
            setLoading(true)
            setError(false)
            try {
                // Passamos o título completo para a API lidar com a filtragem de temporada
                const response = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(animeTitle)}`)
                const data = await response.json()

                if (data && Array.isArray(data)) {
                    // Ordenação numérica inteligente (para não misturar ep 1 com ep 10)
                    const sortedData = data.sort((a: Episode, b: Episode) => {
                        const numA = parseInt(a.title.replace(/\D/g, '')) || 0;
                        const numB = parseInt(b.title.replace(/\D/g, '')) || 0;
                        return numA - numB;
                    });
                    setEpisodes(sortedData);
                }
            } catch (err) {
                console.error("Erro ao buscar episódios:", err)
                setError(true)
            } finally {
                setLoading(false)
            }
        }

        fetchEpisodes()
    }, [animeTitle])

    // Função para extrair o vídeo baseado no índice da lista
    const playEpisode = async (index: number) => {
        const ep = episodes[index];
        if (!ep) return;

        setIsExtracting(true);

        try {
            const apiUrl = `http://localhost:3000/api/video?url=${encodeURIComponent(ep.link)}&provider=${ep.provider}`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.url) {
                setSelectedVideoUrl(data.url);
                setCurrentIndex(index);

                // --- ATUALIZAÇÃO DE PROGRESSO ---
                const epMatch = ep.title.match(/\d+/);
                const episodeNum = epMatch ? parseInt(epMatch[0]) : null;

                if (episodeNum !== null) {
                    const type = mediaType === 'manga' ? 'manga' : 'anime';

                    // DEBUG: Verifique se o ID que chega aqui é o mesmo que aparece no console da Store
                    console.log("Tentando atualizar progresso do ID:", animeId, "para o ep:", episodeNum);

                    updateProgress(Number(animeId), episodeNum, type);
                }
            } else {
                alert("O provedor não liberou o player.");
            }
        } catch (err) {
            console.error("Erro na extração:", err);
        } finally {
            setIsExtracting(false);
        }
    };

    // Funções de navegação para o VideoPlayer
    const handleNext = () => {
        if (currentIndex !== null && currentIndex < episodes.length - 1) {
            playEpisode(currentIndex + 1)
        }
    }

    const handlePrev = () => {
        if (currentIndex !== null && currentIndex > 0) {
            playEpisode(currentIndex - 1)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4 animate-in fade-in duration-500">
                <div
                    className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: theme.primary, borderTopColor: 'transparent' }}
                />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50" style={{ color: textColor }}>
                    Sincronizando Provedores...
                </span>
            </div>
        )
    }

    if (error || episodes.length === 0) {
        return (
            <div
                className="flex flex-col items-center justify-center py-16 px-6 rounded-[2.5rem] border-2 border-dashed"
                style={{ borderColor: hexToRgba(textColor, 0.05), color: hexToRgba(textColor, 0.4) }}
            >
                <AlertCircle size={32} className="mb-4 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest text-center">
                    {error ? 'Erro na API Local' : `Nenhum episódio encontrado para esta temporada`}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 text-[10px] font-bold underline opacity-60 hover:opacity-100"
                >
                    Tentar Novamente
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 opacity-50" style={{ color: textColor }}>
                    <Tv size={14} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Temporada Disponível</span>
                </div>
                <span
                    className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border"
                    style={{
                        backgroundColor: hexToRgba(theme.primary, 0.1),
                        borderColor: hexToRgba(theme.primary, 0.2),
                        color: theme.primary
                    }}
                >
                    {episodes.length} Episódios
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {episodes.map((ep, idx) => (
                    <button
                        key={idx}
                        onClick={() => playEpisode(idx)}
                        disabled={isExtracting}
                        className="group relative flex items-center gap-4 p-3 rounded-[1.8rem] border transition-all hover:scale-[1.02] active:scale-95 text-left disabled:opacity-50"
                        style={{
                            backgroundColor: hexToRgba(theme.navbar, 0.4),
                            borderColor: currentIndex === idx ? theme.primary : hexToRgba(textColor, 0.05)
                        }}
                    >
                        <div className="relative w-24 h-16 flex-shrink-0 overflow-hidden rounded-2xl bg-zinc-800 shadow-lg">
                            {/* Overlay de Play */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <Play size={16} className="fill-white text-white" />
                            </div>

                            {/* Thumbnail ou Placeholder */}
                            <img
                                src={ep.img}
                                alt=""
                                className="..."
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = "https://via.placeholder.com/150x100?text=Sem+Thumb";
                                }}
                            />
                        </div>

                        <div className="flex flex-col gap-1 pr-4 overflow-hidden">
                            <span className="text-[8px] font-black uppercase tracking-tighter opacity-40" style={{ color: textColor }}>
                                {ep.provider}
                            </span>
                            <h4 className="text-sm font-black italic uppercase leading-tight truncate" style={{ color: textColor }}>
                                {ep.title}
                            </h4>
                        </div>
                    </button>
                ))}
            </div>

            {/* Overlay de Loading da Extração */}
            {isExtracting && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center">
                    <div className="relative">
                        <Loader2 size={48} className="animate-spin" style={{ color: theme.primary }} />
                        <Play size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: theme.primary }} />
                    </div>
                    <span className="mt-6 text-[11px] font-black uppercase tracking-[0.5em] text-white animate-pulse">
                        Extraindo Media Stream...
                    </span>
                </div>
            )}

            {/* Video Player Render */}
            {selectedVideoUrl && currentIndex !== null && (
                <VideoPlayer
                    url={selectedVideoUrl}
                    title={episodes[currentIndex].title}
                    onClose={() => {
                        setSelectedVideoUrl(null)
                        setCurrentIndex(null)
                    }}
                    onNext={currentIndex < episodes.length - 1 ? handleNext : undefined}
                    onPrev={currentIndex > 0 ? handlePrev : undefined}
                />
            )}
        </div>
    )
}