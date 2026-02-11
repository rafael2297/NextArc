import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export type Toast = {
    id: string
    message: string
    type: ToastType
    duration?: number
    actionLabel?: string;
    onAction?: () => void;
}

type ToastStore = {
    toasts: Toast[]
    showToast: (
        message: string,
        type?: ToastType,
        duration?: number,
        actionLabel?: string,   
        onAction?: () => void
    ) => void
    removeToast: (id: string) => void
}

export const useToast = create<ToastStore>((set) => ({
    toasts: [],

    showToast: (message, type = 'info', duration = 3000, actionLabel?: string, onAction?: () => void) =>
        set((state) => ({
            toasts: [
                ...state.toasts,
                {
                    id: crypto.randomUUID(),
                    message,
                    type,
                    duration,
                    actionLabel,
                    onAction,
                },
            ],
        })),

    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}))
