import { useEffect } from 'react'
import { useThemeStore } from '../store/useThemeStore'

export default function ThemeHandler() {
    const { primaryColor, primaryGlow, backgroundImage } = useThemeStore()

    useEffect(() => {
        const root = document.documentElement

        // Aplica a cor sólida (o novo Indigo)
        root.style.setProperty('--color-primary', primaryColor)

        // Aplica o brilho (usado em sombras e blurs)
        root.style.setProperty('--color-primary-glow', primaryGlow)

        // Configuração da Imagem de Fundo (opcional)
        if (backgroundImage) {
            document.body.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,1)), url(${backgroundImage})`
            document.body.style.backgroundSize = 'cover'
            document.body.style.backgroundAttachment = 'fixed'
            document.body.style.backgroundPosition = 'center'
        } else {
            document.body.style.backgroundImage = 'none'
            document.body.style.backgroundColor = 'black'
        }
    }, [primaryColor, primaryGlow, backgroundImage])

    return null // Este componente não renderiza nada visualmente
}