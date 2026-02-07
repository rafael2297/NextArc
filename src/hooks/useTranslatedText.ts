import { useState, useCallback } from 'react'

interface Options {
    malId: number
    textToTranslate: string | null
}

export function useTranslatedText({ malId, textToTranslate }: Options) {
    const [translated, setTranslated] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [showOriginal, setShowOriginal] = useState(false)

    const cacheKey = `trans-cache-${malId}`

    const handleTranslate = useCallback(async () => {
        if (translated) {
            setShowOriginal(prev => !prev)
            return
        }

        const cached = localStorage.getItem(cacheKey)
        if (cached) {
            setTranslated(cached)
            setShowOriginal(false)
            return
        }

        if (!textToTranslate || textToTranslate.trim() === '') return

        try {
            setLoading(true)

            // 1. Dividir o texto em pedaços de no máximo 2000 caracteres
            // Tentamos cortar nos parágrafos (\n) para não quebrar frases ao meio
            const maxLength = 2000
            const chunks = textToTranslate.match(new RegExp(`[\\s\\S]{1,${maxLength}}`, 'g')) || []

            const translatedChunks = await Promise.all(
                chunks.map(async (chunk) => {
                    const res = await fetch(
                        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t&q=${encodeURIComponent(chunk)}`
                    )

                    if (!res.ok) throw new Error('Falha na parte da tradução')

                    const data = await res.json()
                    return data[0].map((item: any) => item[0]).join('')
                })
            )

            const finalResult = translatedChunks.join('')

            localStorage.setItem(cacheKey, finalResult)
            setTranslated(finalResult)
            setShowOriginal(false)
        } catch (error) {
            console.error("Erro ao traduzir texto longo:", error)
            alert("O texto é muito longo ou houve uma falha na rede. Tente novamente.")
        } finally {
            setLoading(false)
        }
    }, [malId, textToTranslate, translated, cacheKey])

    return {
        text: showOriginal || !translated ? textToTranslate : translated,
        loading,
        isTranslated: Boolean(translated),
        showOriginal,
        handleTranslate,
    }
}