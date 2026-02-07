import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AuthProvider = 'local' | 'google'

export type UserTheme = {
    background: string;
    navbar: string;
    primary: string;
}

export type UserProfile = {
    name: string
    avatar: string
    banner?: string
    theme: UserTheme;
    provider: AuthProvider
    accessToken?: string
}

type ProfileStore = {
    profile: UserProfile
    driveEnabled: boolean
    updateProfile: (data: Partial<UserProfile>) => void
    setGoogleProfile: (data: {
        name: string
        avatar: string
        accessToken?: string
    }) => void
    resetProfile: () => void
    toggleDrive: (value?: boolean) => void
    exportProfileJson: () => void
    setProfile: (profile: UserProfile) => void
}

const defaultProfile: UserProfile = {
    name: 'Otaku',
    avatar: '',
    banner: '',
    theme: {
        background: '#000000',
        navbar: '#0a0a0a',
        primary: '#3b82f6',
    },
    provider: 'local',
    accessToken: undefined,
}

export const useProfileStore = create<ProfileStore>()(
    persist(
        (set, get) => ({
            /* ---------------- STATE ---------------- */
            profile: defaultProfile,
            driveEnabled: false,

            /* ---------------- ACTIONS ---------------- */

            updateProfile: (data) =>
                set((state) => ({
                    profile: {
                        ...state.profile,
                        ...data,
                        // Garante que se o data trouxer um theme parcial, ele mescle com o existente
                        theme: data.theme ? { ...state.profile.theme, ...data.theme } : state.profile.theme
                    },
                })),

            setProfile: (profile) => set({ profile }),

            setGoogleProfile: ({ name, avatar, accessToken }) =>
                set((state) => ({
                    profile: {
                        ...state.profile,
                        name,
                        avatar,
                        provider: 'google',
                        ...(accessToken ? { accessToken } : {}),
                    },
                    driveEnabled: true,
                })),

            resetProfile: () =>
                set({
                    profile: defaultProfile,
                    driveEnabled: false,
                }),

            toggleDrive: (value) =>
                set((state) => ({
                    driveEnabled:
                        typeof value === 'boolean'
                            ? value
                            : !state.driveEnabled,
                })),

            exportProfileJson: () => {
                const profile = get().profile
                const blob = new Blob(
                    [JSON.stringify(profile, null, 2)],
                    { type: 'application/json' }
                )
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `perfil-${profile.name.toLowerCase()}.json`
                a.click()
                URL.revokeObjectURL(url)
            },
        }),
        {
            name: 'profile-store',
            // LÓGICA DE MIGRAÇÃO: Isso evita que o app quebre ao encontrar dados antigos
            version: 1,
            migrate: (persistedState: any, version: number) => {
                if (version === 0 || !persistedState.profile?.theme) {
                    // Se o usuário tinha a versão antiga, injetamos o objeto theme padrão
                    return {
                        ...persistedState,
                        profile: {
                            ...persistedState.profile,
                            theme: defaultProfile.theme
                        }
                    };
                }
                return persistedState as ProfileStore;
            },
        }
    )
)