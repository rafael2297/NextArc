import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
    // A cor principal de destaque (substitui o Indigo)
    primaryColor: string
    // Versão com transparência para brilhos/glow
    primaryGlow: string
    // Imagem de fundo opcional
    backgroundImage: string | null

    // Ações
    setPrimaryColor: (color: string) => void
    setBackgroundImage: (url: string | null) => void
    resetTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            // Cor padrão: O Indigo que você já usa (#6366f1)
            primaryColor: '#6366f1',
            primaryGlow: 'rgba(99, 102, 241, 0.5)',
            backgroundImage: null,

            setPrimaryColor: (color: string) => {
                // Se a cor vier em HEX, tentamos converter para RGBA para o Glow
                // Caso contrário, usamos um fallback simples
                const glow = color.startsWith('#')
                    ? `${color}80` // Adiciona 50% de transparência em HEX
                    : color

                set({ primaryColor: color, primaryGlow: glow })
            },

            setBackgroundImage: (url: string | null) => set({ backgroundImage: url }),

            resetTheme: () => set({
                primaryColor: '#6366f1',
                primaryGlow: 'rgba(99, 102, 241, 0.5)',
                backgroundImage: null
            }),
        }),
        {
            name: 'flick-theme-storage', // Nome da chave no LocalStorage
        }
    )
)