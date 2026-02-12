import { motion } from 'framer-motion'
import { X, RefreshCw, Download, CheckCircle2 } from 'lucide-react'
import { useEffect } from 'react'
import { useToast } from './useToast'
import type { Toast } from './useToast'

const styles = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-yellow-500 text-black',
    info: 'bg-blue-600 text-white',
}

type Props = {
    toast: Toast
}

export function ToastItem({ toast }: Props) {
    const { removeToast } = useToast()

    useEffect(() => {
        // Se a duração for 0, não remove automaticamente (útil para updates críticos)
        if (toast.duration === 0) return

        const timer = setTimeout(() => {
            removeToast(toast.id)
        }, toast.duration ?? 3000)

        return () => clearTimeout(timer)
    }, [toast.id, toast.duration, removeToast])

    // Lógica simples para escolher o ícone do botão baseado no tipo ou no título
    const isUpdateReady = toast.type === 'success' && toast.title?.toLowerCase().includes('pronto')

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.25 }}
            className={`relative flex flex-col rounded-2xl p-4 shadow-2xl transition-all ${
                toast.actionLabel ? 'gap-3' : 'gap-0'
            } ${styles[toast.type]}`}
        >
            <div className="flex items-start gap-3">
                <div className="flex-1 flex flex-col gap-0.5">
                    {/* Renderiza o TÍTULO se ele existir */}
                    {toast.title && (
                        <span className="text-[10px] font-black uppercase tracking-wider opacity-80">
                            {toast.title}
                        </span>
                    )}
                    <span className="text-xs font-bold leading-tight">
                        {toast.message}
                    </span>
                </div>

                <button
                    onClick={() => removeToast(toast.id)}
                    className="opacity-50 hover:opacity-100 transition-opacity p-1 -mr-1 -mt-1"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* ÁREA DO BOTÃO */}
            {toast.actionLabel && (
                <button
                    onClick={() => {
                        toast.onAction?.()
                        // Removemos o toast após a ação, a menos que seja o de reiniciar 
                        // (pois o app vai fechar de qualquer jeito)
                        removeToast(toast.id)
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-white/20 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition-all active:scale-95"
                >
                    {/* Ícone dinâmico no botão */}
                    {isUpdateReady ? (
                        <CheckCircle2 size={12} />
                    ) : toast.type === 'info' ? (
                        <Download size={12} className="animate-bounce" />
                    ) : (
                        <RefreshCw size={12} className="animate-pulse" />
                    )}
                    
                    {toast.actionLabel}
                </button>
            )}
        </motion.div>
    )
}