import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export type Toast = {
    id: string
    message: string
    type: ToastType
    duration?: number
}

type ToastStore = {
    toasts: Toast[]
    showToast: (
        message: string,
        type?: ToastType,
        duration?: number
    ) => void
    removeToast: (id: string) => void
}

export const useToast = create<ToastStore>((set) => ({
    toasts: [],

    showToast: (message, type = 'info', duration = 3000) =>
        set((state) => ({
            toasts: [
                ...state.toasts,
                {
                    id: crypto.randomUUID(),
                    message,
                    type,
                    duration,
                },
            ],
        })),

    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}))
