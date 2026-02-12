import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export type Toast = {
    id: string
    title?: string; // Adicionado título
    message: string
    type: ToastType
    duration?: number
    actionLabel?: string
    onAction?: () => void
}

// Interface para quando passamos um objeto no showToast
interface ToastOptions {
    title?: string
    message: string
    type?: ToastType
    duration?: number
    action?: {
        label: string
        onClick: () => void
    }
}

type ToastStore = {
    toasts: Toast[]
    showToast: (
        messageOrOptions: string | ToastOptions, // Aceita string ou Objeto
        type?: ToastType,
        duration?: number,
        actionLabel?: string,
        onAction?: () => void
    ) => void
    removeToast: (id: string) => void
}

export const useToast = create<ToastStore>((set) => ({
    toasts: [],

    showToast: (messageOrOptions, type = 'info', duration = 3000, actionLabel, onAction) =>
        set((state) => {
            let newToast: Toast;

            if (typeof messageOrOptions === 'object') {
                // Se for objeto (como estamos usando no App.tsx)
                newToast = {
                    id: crypto.randomUUID(),
                    title: messageOrOptions.title,
                    message: messageOrOptions.message,
                    type: messageOrOptions.type || 'info',
                    duration: messageOrOptions.duration ?? 3000,
                    actionLabel: messageOrOptions.action?.label,
                    onAction: messageOrOptions.action?.onClick,
                };
            } else {
                // Se for a string tradicional
                newToast = {
                    id: crypto.randomUUID(),
                    message: messageOrOptions,
                    type,
                    duration,
                    actionLabel,
                    onAction,
                };
            }

            return { toasts: [...state.toasts, newToast] };
        }),

    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}))