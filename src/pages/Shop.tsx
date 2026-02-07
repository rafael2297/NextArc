import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Coins, Sparkles, ArrowLeft, CheckCircle2, Lock, Info, RotateCcw } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import type { CardItem, PackResult } from '../store/useAppStore'
import { useNavigate } from 'react-router-dom'
import { useProfileController } from '../hooks/useSettingsController'

const PACK_PRICE = 50
const RARITY_CHANCES = {
    legendary: 0.05,
    epic: 0.15,
    rare: 0.30,
    common: 0.50
}

export default function Shop() {
    const navigate = useNavigate()
    const { coins, spendCoins, addCardToInventory, animeList, inventory } = useAppStore()
    const { profile } = useProfileController()

    // --- SISTEMA DE CORES E BANNER ---
    const primaryColor = profile?.theme?.primary || '#6366f1'
    const bgColor = profile?.theme?.background || '#09090b'
    const bannerImage = profile?.banner || ''
    const isLight = bgColor.toLowerCase() === '#ffffff' || bgColor.toLowerCase() === 'white'

    const [selectedAnime, setSelectedAnime] = useState<any>(null)
    const [possibleCharacters, setPossibleCharacters] = useState<any[]>([])
    const [isOpening, setIsOpening] = useState(false)
    const [loadingChars, setLoadingChars] = useState(false)
    const [result, setResult] = useState<PackResult | null>(null)

    useEffect(() => {
        if (selectedAnime && !result) {
            fetchCharacters(selectedAnime.id)
        }
    }, [selectedAnime])

    async function fetchCharacters(animeId: number) {
        setLoadingChars(true)
        try {
            const response = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/characters`)
            const data = await response.json()
            setPossibleCharacters(data.data?.slice(0, 15) || [])
        } catch (err) {
            console.error("Erro ao buscar personagens:", err)
        } finally {
            setLoadingChars(false)
        }
    }

    const checkIsOwned = (charId: any) => {
        if (!selectedAnime) return false;
        return inventory.some(card =>
            Number(card.id) === Number(charId) &&
            Number(card.animeId) === Number(selectedAnime.id)
        );
    }

    const handleOpenPack = () => {
        if (possibleCharacters.length === 0 || loadingChars) return
        if (coins < PACK_PRICE) {
            alert("ArcCoins insuficientes!")
            return
        }

        if (spendCoins(PACK_PRICE)) {
            setIsOpening(true)
            setTimeout(() => {
                const char = possibleCharacters[Math.floor(Math.random() * possibleCharacters.length)]
                const chance = Math.random()

                let rarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common'
                if (chance < RARITY_CHANCES.legendary) rarity = 'legendary'
                else if (chance < RARITY_CHANCES.legendary + RARITY_CHANCES.epic) rarity = 'epic'
                else if (chance < RARITY_CHANCES.legendary + RARITY_CHANCES.epic + RARITY_CHANCES.rare) rarity = 'rare'

                const newCard: CardItem = {
                    id: Number(char.character.mal_id),
                    animeId: Number(selectedAnime.id),
                    name: char.character.name,
                    image: char.character.images.webp.image_url,
                    rarity,
                    animeTitle: selectedAnime.title,
                    collectedAt: Date.now()
                }

                const openResult = addCardToInventory(newCard, PACK_PRICE)
                setResult(openResult)
                setIsOpening(false)
            }, 2000)
        }
    }

    return (
        <div className="min-h-screen transition-colors duration-500 p-4 md:p-6 pb-32 relative overflow-hidden"
            style={{ backgroundColor: bgColor, color: isLight ? '#18181b' : '#ffffff' }}>

            {/* Banner de Fundo (Ambientação) */}
            {bannerImage && (
                <div className="absolute inset-0 z-0 pointer-events-none opacity-10">
                    <img src={bannerImage} className="w-full h-full object-cover blur-2xl scale-110" alt="" />
                    <div className="absolute inset-0" style={{ background: `radial-gradient(circle at center, transparent, ${bgColor})` }} />
                </div>
            )}

            {/* Botão Voltar */}
            <div className="fixed top-6 left-4 md:top-20 md:left-6 z-[9999]">
                <button
                    onClick={() => {
                        if (selectedAnime && !result) {
                            setSelectedAnime(null)
                            setPossibleCharacters([])
                        } else {
                            navigate(-1)
                        }
                    }}
                    className="group flex items-center justify-center w-10 h-10 md:w-12 md:h-12 border rounded-xl md:rounded-2xl shadow-2xl active:scale-90 transition-all"
                    style={{
                        backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                        borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
                    }}
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 pt-16 md:pt-8 max-w-5xl mx-auto gap-4 relative z-10">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter">Card Shop</h1>
                    <p className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">Adquira novos boosters de personagens</p>
                </div>
                <div className="flex items-center gap-3 border px-4 py-2 rounded-xl shadow-xl backdrop-blur-md"
                    style={{
                        backgroundColor: isLight ? 'white' : 'rgba(24, 24, 27, 0.8)',
                        borderColor: `${primaryColor}40`
                    }}>
                    <Coins size={18} style={{ color: primaryColor }} />
                    <span className="font-black text-lg md:text-xl" style={{ color: primaryColor }}>{coins.toLocaleString()}</span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!selectedAnime ? (
                    <motion.div
                        key="shelf"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto relative z-10"
                    >
                        {animeList.map((anime) => (
                            <motion.button
                                key={anime.id}
                                whileHover={{ y: -12, scale: 1.02 }}
                                onClick={() => setSelectedAnime(anime)}
                                className="relative group aspect-[2/3] w-full"
                            >
                                {/* Efeito de glow ao passar o mouse */}
                                <div className="absolute inset-0 blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                                    style={{ backgroundColor: primaryColor }} />

                                <div className="w-full h-full bg-zinc-900 rounded-[1.8rem] md:rounded-[2.2rem] relative overflow-hidden flex flex-col border border-white/10 shadow-2xl transition-all group-hover:border-white/30">

                                    {/* Arte de fundo do Booster */}
                                    <div className="absolute inset-0 z-0">
                                        <img
                                            src={anime.cover}
                                            className="w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                                            alt=""
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                                    </div>

                                    {/* Conteúdo do Booster */}
                                    <div className="relative z-10 flex flex-col h-full items-center justify-between p-5 md:p-7">
                                        <div className="self-end px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[7px] font-black uppercase tracking-[0.2em] text-white/70">
                                            Premium Edition
                                        </div>

                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-4 rounded-3xl bg-zinc-950/60 backdrop-blur-sm border border-white/5 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                                <Package size={40} style={{ color: primaryColor }} />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-xs md:text-sm font-black uppercase italic tracking-tighter leading-tight line-clamp-2 px-2 text-white">
                                                    {anime.title}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="w-full py-3 rounded-2xl bg-zinc-950/80 border border-white/5 flex items-center justify-center gap-2 group-hover:bg-white group-hover:text-black transition-all duration-300">
                                            <Coins size={14} className="group-hover:text-black" style={{ color: primaryColor }} />
                                            <span className="text-xs font-black italic">{PACK_PRICE} ARC</span>
                                        </div>
                                    </div>

                                    {/* Textura de booster pack nas bordas */}
                                    <div className="absolute top-0 left-0 w-full h-3 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                                    <div className="absolute bottom-0 left-0 w-full h-3 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="opening-table"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="max-w-6xl mx-auto flex flex-col-reverse lg:grid lg:grid-cols-12 gap-8 lg:gap-12 items-start lg:items-center relative z-10"
                    >
                        {/* LISTA DE PERSONAGENS */}
                        <div className="w-full lg:col-span-4 space-y-4 max-h-[40vh] lg:max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 sticky top-0 py-2 z-10 backdrop-blur-sm">
                                <Info size={14} style={{ color: primaryColor }} /> Possíveis Drop
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                                {loadingChars ? (
                                    <p className="text-zinc-600 font-bold animate-pulse uppercase text-[10px]">Lendo registros...</p>
                                ) : (
                                    possibleCharacters.map((char) => {
                                        const owned = checkIsOwned(char.character.mal_id);
                                        return (
                                            <div
                                                key={char.character.mal_id}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${owned
                                                    ? 'bg-emerald-500/10 border-emerald-500/30 opacity-100'
                                                    : 'bg-zinc-900/50 border-white/5 opacity-40 grayscale'
                                                    }`}
                                            >
                                                <img src={char.character.images.webp.image_url} className="w-9 h-9 rounded-lg object-cover" alt="" />
                                                <span className="text-[10px] font-bold uppercase truncate flex-1">{char.character.name}</span>
                                                {owned ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Lock size={14} className="text-zinc-700" />}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* ÁREA DE ANIMAÇÃO DO BOOSTER */}
                        <div className="w-full lg:col-span-8 flex flex-col items-center justify-center py-4">
                            {!result ? (
                                <div className="text-center w-full">
                                    <motion.div
                                        animate={isOpening ? {
                                            rotate: [0, -5, 5, -5, 5, 0],
                                            scale: [1, 1.05, 1],
                                        } : { y: [0, -15, 0] }}
                                        transition={{ repeat: Infinity, duration: isOpening ? 0.15 : 4 }}
                                        className="relative mb-10"
                                    >
                                        <div className="w-52 h-72 md:w-60 md:h-80 mx-auto rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center border-[6px] border-white/10 overflow-hidden relative"
                                            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>
                                            <Package size={64} className="text-white/30" />
                                            <div className="absolute inset-0 bg-white opacity-5 animate-pulse" />
                                        </div>
                                    </motion.div>

                                    <button
                                        onClick={handleOpenPack}
                                        disabled={isOpening || loadingChars}
                                        className="w-full max-w-xs md:max-w-none md:w-auto px-10 md:px-14 py-4 md:py-5 rounded-2xl font-black uppercase italic transition-all hover:scale-105 active:scale-95 disabled:opacity-30 shadow-2xl"
                                        style={{ backgroundColor: isLight ? '#18181b' : '#ffffff', color: isLight ? '#ffffff' : '#18181b' }}
                                    >
                                        <span className="flex items-center justify-center gap-3 text-base md:text-lg">
                                            {isOpening ? 'RASGANDO PACK...' : <><Coins size={20} /> ABRIR BOOSTER</>}
                                        </span>
                                    </button>
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col items-center relative w-full"
                                >
                                    <AnimatePresence>
                                        {result.duplicate && (
                                            <motion.div
                                                initial={{ y: 0, opacity: 0 }}
                                                animate={{ y: -130, opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute z-[100] flex items-center gap-2 font-black text-4xl text-yellow-500 drop-shadow-lg"
                                            >
                                                <Coins size={32} /> +{result.refund}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className={`w-64 h-[400px] md:w-72 md:h-[440px] rounded-[2.5rem] p-1.5 relative shadow-2xl ${result.card.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-400 via-orange-500 to-yellow-600' :
                                            result.card.rarity === 'epic' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' :
                                                result.card.rarity === 'rare' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-zinc-600'
                                        }`}>
                                        <div className="bg-zinc-950 w-full h-full rounded-[2rem] overflow-hidden flex flex-col relative">
                                            <img src={result.card.image} className={`w-full h-3/5 object-cover transition-all duration-1000 ${result.duplicate ? 'grayscale brightness-[0.3]' : ''}`} alt="" />

                                            {result.duplicate && (
                                                <div className="absolute inset-0 flex items-center justify-center z-20">
                                                    <motion.div
                                                        initial={{ scale: 3, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1, rotate: -12 }}
                                                        className="bg-red-600 text-white font-black text-2xl px-6 py-2 border-4 border-white shadow-2xl"
                                                    >
                                                        DUPLICATA
                                                    </motion.div>
                                                </div>
                                            )}

                                            <div className="p-6 flex-1 flex flex-col justify-between bg-zinc-950">
                                                <div>
                                                    <p className={`text-[9px] font-black uppercase tracking-widest ${result.card.rarity === 'legendary' ? 'text-yellow-500' : 'text-zinc-500'}`}>{result.card.rarity}</p>
                                                    <h3 className="text-xl md:text-2xl font-black italic uppercase leading-tight truncate text-white">{result.card.name}</h3>
                                                </div>

                                                {result.duplicate ? (
                                                    <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 p-2 rounded-xl">
                                                        <RotateCcw size={14} />
                                                        <span className="text-[9px] font-black uppercase">Crédito de Reciclagem</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 p-2 rounded-xl">
                                                        <Sparkles size={14} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Added to Album</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setResult(null)}
                                        className="mt-8 w-full max-w-[220px] py-4 rounded-2xl font-black uppercase italic active:scale-95 shadow-xl transition-transform hover:scale-105"
                                        style={{ backgroundColor: primaryColor, color: '#fff' }}
                                    >
                                        Continuar
                                    </button>
                                </motion.div>
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