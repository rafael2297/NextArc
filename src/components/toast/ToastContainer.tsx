import { AnimatePresence } from 'framer-motion'
import { useToast } from './useToast'
import { ToastItem } from './ToastItem'

export function ToastContainer() {
    const { toasts } = useToast()

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex w-[320px] flex-col gap-3">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} />
                ))}
            </AnimatePresence>
        </div>
    )
}
