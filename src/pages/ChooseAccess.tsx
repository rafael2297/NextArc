import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Ghost, Cloud, ShieldCheck, Sparkles, User } from 'lucide-react'

import { ROUTES } from '../routes/paths'
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton'
import { useSessionStore } from '../store/useSessionStore'

export default function ChooseAccess() {
    const navigate = useNavigate()
    const isAuthenticated = useSessionStore((s) => s.isAuthenticated)
    const enterAuthenticated = useSessionStore((s) => s.enterAuthenticated)

    function handleOffline() {
        enterAuthenticated()
    }

    useEffect(() => {
        if (isAuthenticated) {
            navigate(ROUTES.PROFILE, { replace: true })
        }
    }, [isAuthenticated, navigate])

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Header Card */}
                <div className="text-center mb-8 space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl mb-4">
                        <Sparkles className="text-indigo-500 w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">
                        Bem-vindo
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">
                        Escolha como acessar sua lista
                    </p>
                </div>

                <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/60 rounded-[2rem] p-2 shadow-2xl overflow-hidden">
                    <div className="p-6 space-y-6">

                        {/* Option 1: Cloud / Google */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-zinc-400 mb-2 px-1">
                                <Cloud size={14} />
                                <span className="text-xs font-bold uppercase tracking-wider">Modo Nuvem</span>
                            </div>

                            <div className="bg-zinc-950/50 rounded-2xl p-8 border border-zinc-800/50 flex flex-col items-center gap-6 transition-colors hover:border-indigo-500/30 group">
                                <div className="text-center space-y-2">
                                    <h3 className="text-white font-bold text-lg">Sincronizar Tudo</h3>
                                    <p className="text-zinc-500 text-xs leading-relaxed max-w-[220px] mx-auto">
                                        Salve seus animes, histórico e notas na nuvem.
                                    </p>
                                </div>

                                {/* Container do botão: Força o botão a ter um tamanho bom */}
                                <div className="w-full max-w-[280px] flex justify-center transform transition-transform duration-300 hover:scale-105">
                                    <GoogleLoginButton />
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="relative flex items-center justify-center py-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-zinc-800"></div>
                            </div>
                            <span className="relative z-10 bg-zinc-900/60 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                OU
                            </span>
                        </div>

                        {/* Option 2: Offline / Guest */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-zinc-400 mb-2 px-1">
                                <ShieldCheck size={14} />
                                <span className="text-xs font-bold uppercase tracking-wider">Modo Local</span>
                            </div>

                            <button
                                onClick={handleOffline}
                                className="w-full group relative overflow-hidden bg-zinc-800 hover:bg-zinc-700 text-white p-1 rounded-2xl transition-all duration-300 active:scale-95"
                            >
                                <div className="relative z-10 flex items-center justify-between px-5 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-700/50 flex items-center justify-center group-hover:bg-zinc-600/50 transition-colors">
                                            <Ghost size={20} className="text-zinc-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="text-left">
                                            <span className="block text-sm font-bold text-zinc-200 group-hover:text-white">Entrar como Visitante</span>
                                            <span className="block text-[10px] text-zinc-500 font-medium uppercase tracking-wider group-hover:text-zinc-400">Dados salvos no navegador</span>
                                        </div>
                                    </div>
                                    <User size={16} className="text-zinc-600 group-hover:text-zinc-300" />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Footer aesthetic strip */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-indigo-900/50 to-transparent opacity-50" />
                </div>
            </motion.div>
        </div>
    )
}