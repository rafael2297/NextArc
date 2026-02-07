import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SessionMode = 'guest' | 'authenticated'
export type NSFWMode = 'show' | 'blur' | 'hide'

interface SessionState {
    /** 🔑 sessão */
    hasAccess: boolean
    mode: SessionMode | null

    /** 👤 helpers */
    isAuthenticated: boolean
    isGuest: boolean

    /** ☁️ restore */
    isRestoring: boolean
    hasRestoredBackup: boolean

    /** 🔞 preferência */
    nsfwMode: NSFWMode

    /** 🔐 actions */
    enterAsGuest: () => void
    enterAuthenticated: () => void
    startRestore: () => void
    finishRestore: () => void
    setNSFWMode: (mode: NSFWMode) => void
    logout: () => void
}

export const useSessionStore = create<SessionState>()(
    persist(
        (set) => ({
            hasAccess: false,
            mode: null,

            isAuthenticated: false,
            isGuest: false,

            /** ☁️ restore */
            isRestoring: false,
            hasRestoredBackup: false,

            /** 🔞 default seguro */
            nsfwMode: 'blur',

            enterAsGuest: () =>
                set({
                    hasAccess: true,
                    mode: 'guest',
                    isGuest: true,
                    isAuthenticated: false,
                    isRestoring: false,
                    hasRestoredBackup: true,
                    nsfwMode: 'blur',
                }),

            enterAuthenticated: () =>
                set({
                    hasAccess: true,
                    mode: 'authenticated',
                    isGuest: false,
                    isAuthenticated: true,
                    isRestoring: true,
                    hasRestoredBackup: false,
                }),

            startRestore: () =>
                set({
                    isRestoring: true,
                }),

            finishRestore: () =>
                set({
                    isRestoring: false,
                    hasRestoredBackup: true,
                }),

            setNSFWMode: (mode) =>
                set({
                    nsfwMode: mode,
                }),

            logout: () =>
                set({
                    hasAccess: false,
                    mode: null,
                    isGuest: false,
                    isAuthenticated: false,
                    isRestoring: false,
                    hasRestoredBackup: false,
                    nsfwMode: 'blur',
                }),
        }),
        {
            name: 'anime-tracker-session',
            version: 6,
        }
    )
)
