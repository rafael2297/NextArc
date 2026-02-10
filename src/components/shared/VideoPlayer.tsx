import { X, Volume2, Monitor, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfileStore } from '../../store/useProfileStore'
import { hexToRgba } from '../../utils/colors'
import { useEffect } from 'react'

interface PlayerProps {
    url: string
    title: string
    onClose: () => void
    onNext?: () => void
    onPrev?: () => void
}

export default function VideoPlayer({ url, title, onClose, onNext, onPrev }: PlayerProps) {
    const theme = useProfileStore((state) => state.profile.theme)

    useEffect(() => {
        document.body.style.overflow = 'hidden'
        window.scrollTo(0, 0)
        return () => { document.body.style.overflow = 'unset' }
    }, [])

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-black flex flex-col items-center overflow-y-auto"
            >
                {/* 1. HEADER DO PLAYER (FIXO) */}
                <div className="sticky top-0 left-0 right-0 z-[100] w-full bg-gradient-to-b from-black via-black/90 to-transparent px-6 py-8 md:px-12">
                    <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.primary }} />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
                                    NextArc Cinema Mode
                                </span>
                            </div>
                            <h2 className="text-xl md:text-3xl font-black italic uppercase text-white tracking-tighter leading-tight max-w-2xl">
                                {title}
                            </h2>
                        </div>

                        <button
                            onClick={onClose}
                            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/20 transition-all text-white group"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest hidden md:block opacity-60">Fechar</span>
                            <X size={20} className="group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* 2. ÁREA CENTRAL (VÍDEO + SETAS FIXAS) */}
                <div className="w-full max-w-7xl px-4 md:px-12 flex flex-col md:flex-row items-center justify-center gap-8 my-auto min-h-[60vh]">

                    {/* SETA ANTERIOR: Sempre ocupa espaço (w-20) */}
                    <div className="hidden lg:flex w-20 justify-center">
                        <button
                            onClick={onPrev}
                            disabled={!onPrev} // Desabilita se não houver função
                            className={`p-6 rounded-full border transition-all ${onPrev
                                ? "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10 hover:scale-110 shadow-lg"
                                : "bg-transparent border-white/5 text-white/5 cursor-not-allowed" // Estilo "apagado"
                                }`}
                        >
                            <ChevronLeft size={40} />
                        </button>
                    </div>

                    {/* CONTAINER DO VÍDEO: Centralizado */}
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="relative w-full aspect-video bg-zinc-900 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] border-2 border-white/5"
                    >
                        <iframe
                            src={url}
                            className="w-full h-full"
                            allowFullScreen
                            sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
                            allow="autoplay; encrypted-media; picture-in-picture"
                            title={title}
                        />
                    </motion.div>

                    {/* SETA PRÓXIMO: Sempre ocupa espaço (w-20) */}
                    <div className="hidden lg:flex w-20 justify-center">
                        <button
                            onClick={onNext}
                            disabled={!onNext}
                            className={`p-6 rounded-full border transition-all ${onNext
                                ? "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10 hover:scale-110 shadow-lg"
                                : "bg-transparent border-white/5 text-white/5 cursor-not-allowed"
                                }`}
                        >
                            <ChevronRight size={40} />
                        </button>
                    </div>
                </div>

                {/* 3. NAVEGAÇÃO MOBILE (Sempre 2 botões para manter simetria) */}
                <div className="flex lg:hidden gap-4 mt-8 px-6 w-full max-w-md">
                    <button
                        onClick={onPrev}
                        disabled={!onPrev}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border transition-all ${onPrev ? "bg-white/5 border-white/10 text-white" : "bg-transparent border-white/5 text-white/5"
                            }`}
                    >
                        <ChevronLeft size={20} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Anterior</span>
                    </button>

                    <button
                        onClick={onNext}
                        disabled={!onNext}
                        className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border transition-all ${onNext ? "bg-white/5 border-white/10 text-white" : "bg-transparent border-white/5 text-white/5"
                            }`}
                    >
                        <span className="text-[10px] font-bold uppercase tracking-widest">Próximo</span>
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* 4. FOOTER INFO */}
                <div className="w-full max-w-5xl mt-16 mb-12 px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-white/5">
                        <div className="flex items-center gap-4 text-white/20">
                            <ShieldCheck size={18} style={{ color: theme.primary }} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Segurança</span>
                                <span className="text-[9px] font-medium uppercase tracking-tighter">Media Stream Protegido</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-white/20">
                            <Monitor size={18} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Display</span>
                                <span className="text-[9px] font-medium uppercase tracking-tighter">Auto High Definition</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-white/20">
                            <Volume2 size={18} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Sound</span>
                                <span className="text-[9px] font-medium uppercase tracking-tighter">Dolby Digital Pass</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}