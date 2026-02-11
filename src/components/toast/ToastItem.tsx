import { motion } from 'framer-motion'
import { X, RefreshCw } from 'lucide-react'
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
        // Se a duração for 0, não remove automaticamente
        if (toast.duration === 0) return

        const timer = setTimeout(() => {
            removeToast(toast.id)
        }, toast.duration ?? 3000)

        return () => clearTimeout(timer)
    }, [toast.id, toast.duration, removeToast])

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.25 }}
            /* Adicionamos w-full para respeitar o container e condicional de padding */
            className={`relative flex flex-col rounded-2xl p-4 shadow-2xl transition-all ${toast.actionLabel ? 'gap-3' : 'gap-0'
                } ${styles[toast.type]}`}
        >
            {/* ÁREA DA MENSAGEM: Sempre visível */}
            <div className="flex items-start gap-3">
                <span className="flex-1 text-xs font-bold leading-tight self-center">
                    {toast.message}
                </span>
                <button
                    onClick={() => removeToast(toast.id)}
                    className="opacity-50 hover:opacity-100 transition-opacity p-1"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* ÁREA DO BOTÃO: Só existe e ocupa espaço se houver actionLabel */}
            {toast.actionLabel && (
                <button
                    onClick={() => {
                        toast.onAction?.()
                        removeToast(toast.id)
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-white/20 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition-all active:scale-95"
                >
                    <RefreshCw size={12} className="animate-pulse" />
                    {toast.actionLabel}
                </button>
            )}
        </motion.div>
    )
}