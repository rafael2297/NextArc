import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchMediaCharacters } from '../../../services/jikanApi'
import { useProfileStore } from '../../../store/useProfileStore'
import { hexToRgba, getContrastColor } from '../../../utils/colors'

export default function MediaCharactersTab() {
    const { type, id } = useParams()
    const [characters, setCharacters] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const theme = useProfileStore((state) => state.profile.theme)
    const textColor = getContrastColor(theme.background)

    useEffect(() => {
        let isMounted = true

        // Em vez de chamar setLoading(true) aqui, 
        // deixamos a função assíncrona gerenciar o estado.
        async function loadData() {
            try {
                // Se você quiser que o skeleton apareça ao trocar de anime:
                setCharacters([])

                const data = await fetchMediaCharacters(type as any, Number(id))
                if (isMounted) {
                    setCharacters(data)
                }
            } catch (err) {
                console.error(err)
            } finally {
                if (isMounted) setLoading(false)
            }
        }

        loadData()

        return () => { isMounted = false }
    }, [type, id]) // O loading só será true no primeiro mount ou via reset de characters

    // Lógica do Skeleton: Ativa se estiver carregando OU se não houver personagens ainda
    if (loading || characters.length === 0) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse space-y-3">
                        <div className="aspect-[3/4] bg-zinc-800/50 rounded-2xl" />
                        <div className="h-3 w-3/4 bg-zinc-800/50 rounded" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {characters?.slice(0, 18).map((item: any) => (
                <div key={item.character.mal_id} className="group cursor-pointer">
                    <div
                        className="relative aspect-[3/4] overflow-hidden rounded-2xl border transition-all duration-500 group-hover:shadow-2xl"
                        style={{
                            borderColor: hexToRgba(textColor, 0.05),
                            backgroundColor: hexToRgba(theme.navbar, 0.5)
                        }}
                    >
                        <img
                            src={item.character.images.webp.image_url}
                            alt={item.character.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{
                                background: `linear-gradient(to top, ${hexToRgba(theme.background, 0.9)}, transparent)`
                            }}
                        />
                    </div>

                    <div className="mt-4 space-y-1">
                        <p
                            className="text-[10px] font-black uppercase truncate tracking-tight"
                            style={{ color: textColor }}
                        >
                            <span style={{ color: theme.primary }}>
                                {item.character.name.split(' ')[0]}
                            </span>
                            {item.character.name.includes(' ') && ` ${item.character.name.split(' ').slice(1).join(' ')}`}
                        </p>
                        <p
                            className="text-[8px] font-bold uppercase tracking-widest opacity-50"
                            style={{ color: textColor }}
                        >
                            {item.role}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
}