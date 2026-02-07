import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '../store/useAppStore'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Trophy, Info, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../routes/paths'
import { TcgCard } from '../components/TcgCard'
import { useProfileController } from '../hooks/useSettingsController'

export default function Inventory() {
    const navigate = useNavigate()
    const { inventory, animeList } = useAppStore()
    const { profile } = useProfileController()

    // --- SISTEMA DE CORES E BANNER ---
    const primaryColor = profile?.theme?.primary || '#6366f1'
    const bgColor = profile?.theme?.background || '#09090b'
    const bannerImage = profile?.banner || ''
    const isLight = bgColor.toLowerCase() === '#ffffff' || bgColor.toLowerCase() === 'white'

    // Estados
    const [selectedAnime, setSelectedAnime] = useState<any>(null)
    const [animeCharacters, setAnimeCharacters] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Busca personagens do anime selecionado para montar o "layout" do álbum
    useEffect(() => {
        if (selectedAnime) {
            fetchAlbumLayout(selectedAnime.id)
        }
    }, [selectedAnime])

    async function fetchAlbumLayout(animeId: number) {
        setLoading(true)
        try {
            const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/characters`)
            const data = await response.json()
            setAnimeCharacters(data.data?.slice(0, 15) || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const myCardsInThisAnime = useMemo(() => {
        return inventory.filter(card => card.animeTitle === selectedAnime?.title)
    }, [inventory, selectedAnime])

    const legacyCards = useMemo(() => {
        if (!selectedAnime) return []
        const officialIds = animeCharacters.map(c => c.character.mal_id)
        return myCardsInThisAnime.filter(card => !officialIds.includes(card.id))
    }, [myCardsInThisAnime, animeCharacters])

    const getRarityClass = (rarity: string) => {
        switch (rarity) {
            case 'legendary': return 'border-yellow-500 shadow-yellow-500/40 shadow-xl'
            case 'epic': return 'border-purple-500 shadow-purple-500/20 shadow-lg'
            case 'rare': return 'border-blue-500 shadow-blue-500/20 shadow-lg'
            default: return 'border-zinc-700'
        }
    }

    return (
        <div className="min-h-screen transition-colors duration-500 p-4 md:p-6 pb-32 relative overflow-hidden"
            style={{ backgroundColor: bgColor, color: isLight ? '#18181b' : '#ffffff' }}>

            {/* Banner de Fundo (Ambientação) */}
            {bannerImage && (
                <div className="absolute inset-0 z-0 pointer-events-none opacity-10">
                    <img src={bannerImage} className="w-full h-full object-cover blur-3xl scale-125" alt="" />
                    <div className="absolute inset-0" style={{ background: `radial-gradient(circle at center, transparent, ${bgColor})` }} />
                </div>
            )}

            {/* BOTÃO VOLTAR DINÂMICO */}
            <div className="fixed top-6 left-4 md:top-20 md:left-6 z-[9999]">
                <button
                    onClick={() => selectedAnime ? setSelectedAnime(null) : navigate(ROUTES.PROFILE)}
                    className="group flex items-center justify-center w-10 h-10 md:w-12 md:h-12 border rounded-xl md:rounded-2xl shadow-2xl active:scale-90 transition-all"
                    style={{
                        backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                        borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
                    }}
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </button>
            </div>

            {/* HEADER ATUALIZADO */}
            <header className="pt-16 md:pt-8 mb-12 max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter">
                        {selectedAnime ? 'Sua Coleção' : 'Meus Álbuns'}
                    </h1>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                        {selectedAnime ? selectedAnime.title : `${inventory.length} Figurinhas Totais`}
                    </p>
                </div>
                {selectedAnime && (
                    <div className="border px-4 py-2 rounded-xl flex items-center gap-3 backdrop-blur-md shadow-xl"
                        style={{
                            backgroundColor: isLight ? 'white' : 'rgba(24, 24, 27, 0.8)',
                            borderColor: `${primaryColor}40`
                        }}>
                        <Trophy size={18} style={{ color: primaryColor }} />
                        <span className="text-sm font-black" style={{ color: primaryColor }}>
                            {myCardsInThisAnime.length} <span className="text-zinc-500 mx-1">/</span> {animeCharacters.length}
                        </span>
                    </div>
                )}
            </header>

            <AnimatePresence mode="wait">
                {!selectedAnime ? (
                    /* SELEÇÃO DE ÁLBUM (GRID) */
                    <motion.div
                        key="selector"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto relative z-10"
                    >
                        {animeList.map(anime => {
                            const myCount = inventory.filter(c => c.animeTitle === anime.title).length
                            const totalSlots = 15
                            const percentage = Math.min((myCount / totalSlots) * 100, 100)

                            return (
                                <button
                                    key={anime.id}
                                    onClick={() => setSelectedAnime(anime)}
                                    className="group relative bg-zinc-900 border border-white/5 p-4 rounded-[2.2rem] hover:border-white/20 transition-all flex items-center gap-5 text-left overflow-hidden shadow-2xl"
                                >
                                    {/* Efeito Glow no fundo do Card Selecionado */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
                                        style={{ backgroundColor: primaryColor }} />

                                    <div className="relative w-24 h-32 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-500">
                                        <img src={anime.cover} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                                        <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md rounded-lg py-1 flex items-center justify-center border border-white/10 text-[9px] font-black text-white">
                                            {Math.floor(percentage)}%
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col h-28 justify-between py-1 relative z-10">
                                        <div>
                                            <h3 className="font-black uppercase italic text-sm leading-tight mb-1 group-hover:text-white transition-colors text-white">
                                                {anime.title}
                                            </h3>
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                {myCount} de {totalSlots} cartas
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-tighter text-zinc-600">
                                                <span>Progresso</span>
                                                {percentage === 100 && <span style={{ color: primaryColor }}>Completo!</span>}
                                            </div>
                                            <div className="w-full h-1.5 bg-zinc-950 rounded-full border border-white/5 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    style={{ backgroundColor: primaryColor }}
                                                    className="h-full rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </motion.div>
                ) : (
                    /* VISUAL DO ÁLBUM ABERTO */
                    <motion.div
                        key="album"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="max-w-6xl mx-auto relative z-10"
                    >
                        <div
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
                            style={{ perspective: "1000px" }}
                        >
                            {loading ? (
                                Array(10).fill(0).map((_, i) => (
                                    <div key={i} className="aspect-[3/4] bg-zinc-900/50 animate-pulse rounded-3xl border border-white/5" />
                                ))
                            ) : (
                                <>
                                    {/* CARTAS DA API */}
                                    {animeCharacters.map((char) => {
                                        const cardOwned = inventory.find(c => c.id === char.character.mal_id)
                                        const displayCard = cardOwned || {
                                            name: char.character.name,
                                            rarity: 'common'
                                        }

                                        return (
                                            <TcgCard
                                                key={char.character.mal_id}
                                                card={displayCard}
                                                isOwned={!!cardOwned}
                                                getRarityClass={getRarityClass}
                                            />
                                        )
                                    })}

                                    {/* CARTAS LEGACY */}
                                    {legacyCards.map((card) => (
                                        <TcgCard
                                            key={card.id}
                                            card={{ ...card, isLegacy: true }}
                                            isOwned={true}
                                            getRarityClass={getRarityClass}
                                        />
                                    ))}
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: ${primaryColor}60; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
            `}</style>
        </div>
    )
}