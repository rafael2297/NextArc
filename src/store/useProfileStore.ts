import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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
    version?: string;
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
            storage: createJSONStorage(() => localStorage),
            version: 1,
            // 🛑 IMPEDE O ZUSTAND DE INICIAR SOZINHO (EVITA SOBREESCRITA)
            skipHydration: true, 
            migrate: (persistedState: any, version: number) => {
                if (version === 0 || !persistedState?.profile?.theme) {
                    return {
                        ...persistedState,
                        profile: {
                            ...(persistedState?.profile || defaultProfile),
                            theme: defaultProfile.theme
                        }
                    };
                }
                return persistedState as ProfileStore;
            },
        }
    )
)