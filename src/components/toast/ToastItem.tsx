import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useToast } from './useToast'
import type { Toast } from './useToast'

const styles = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-500 text-black',
    info: 'bg-blue-600',
}

type Props = {
    toast: Toast
}

export function ToastItem({ toast }: Props) {
    const { removeToast } = useToast()

    useEffect(() => {
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
            className={`relative flex items-start gap-3 rounded-lg px-4 py-3 text-sm shadow-lg ${styles[toast.type]}`}
        >
            <span className="flex-1">{toast.message}</span>

            <button
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100"
            >
                <X className="h-4 w-4" />
            </button>
        </motion.div>
    )
}
