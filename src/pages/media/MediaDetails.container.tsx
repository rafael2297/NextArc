import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

import MediaDetailsLayout from './MediaDetails.view'
import { fetchMediaDetails } from '../../services/jikanApi'
import type {
    MediaType,
    JikanAnime,
    JikanManga,
} from '../../services/jikanApi'
import { useAppStore } from '../../store/useAppStore'

type MediaData = JikanAnime | JikanManga

export default function MediaDetailsContainer() {
    const { type, id } = useParams<{ type?: string; id?: string }>()
    const navigate = useNavigate()

    const [data, setData] = useState<MediaData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [suggestions, setSuggestions] = useState<MediaData[]>([])

    const { addAnime, addManga, hasAnime, hasManga } = useAppStore()

    useEffect(() => {
        // Validação inicial para evitar undefined nas funções abaixo
        if (!type || !id || (type !== 'anime' && type !== 'manga')) {
            setError(true)
            setLoading(false)
            return
        }

        let cancelled = false

        async function load() {
            setLoading(true)
            setError(false)
            setSuggestions([])

            try {
                // Criamos uma referência garantida para o TS não reclamar de 'undefined'
                const currentId: string = id as string;
                let targetId: number;

                // 🔍 LÓGICA DE MATCH: Se o ID não for um número (título vindo do scraping)
                if (isNaN(Number(currentId))) {
                    const cleanName = currentId.split(/Episódio|–|-/i)[0].trim();
                    
                    const searchRes = await axios.get(
                        `https://api.jikan.moe/v4/${type}?q=${encodeURIComponent(cleanName)}&limit=5`
                    );

                    const results = searchRes.data.data;

                    if (!results || results.length === 0) {
                        throw new Error("Nada encontrado");
                    }

                    // Se o primeiro resultado for muito similar, ou for único, seguimos direto
                    const bestMatch = results[0];
                    const isVerySimilar = bestMatch.title.toLowerCase().includes(cleanName.toLowerCase());

                    if (results.length === 1 || isVerySimilar) {
                        targetId = bestMatch.mal_id;
                        // Atualiza a URL para o ID numérico sem recarregar a página
                        window.history.replaceState(null, '', `/media/${type}/${targetId}`);
                    } else {
                        // Caso contrário, mostra a tela de sugestões na View
                        if (!cancelled) setSuggestions(results);
                        setLoading(false);
                        return;
                    }
                } else {
                    // Se já é um número, usamos ele diretamente
                    targetId = Number(currentId);
                }

                // Busca detalhes finais
                const result = await fetchMediaDetails<MediaData>(
                    type as MediaType,
                    targetId
                );

                if (!cancelled) setData(result);
            } catch (err) {
                console.error("Erro no carregamento:", err);
                if (!cancelled) setError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load()
        return () => { cancelled = true }
    }, [type, id])

    const handleSelectSuggestion = (selectedId: number) => {
        // Redireciona para a mesma página, mas agora com o ID numérico correto
        navigate(`/media/${type}/${selectedId}`);
    };

    const isAdded = useMemo(() => {
        if (!data || !type) return false
        return type === 'anime' ? hasAnime(data.mal_id) : hasManga(data.mal_id)
    }, [data, type, hasAnime, hasManga])

    function handleAdd() {
        if (!data || !type) return
        if (type === 'anime') {
            const anime = data as JikanAnime
            addAnime({
                id: anime.mal_id,
                title: anime.title,
                cover: anime.images.jpg.image_url,
                totalEpisodes: anime.episodes ?? 0,
                currentEpisode: 0,
                status: 'watching',
            })
        } else {
            const manga = data as JikanManga
            addManga({
                id: manga.mal_id,
                title: manga.title,
                cover: manga.images.jpg.image_url,
                totalChapters: manga.chapters ?? 0,
                currentChapter: 0,
                status: 'reading',
                format: 'manga',
            })
        }
    }

    return (
        <MediaDetailsLayout
            loading={loading}
            error={error}
            data={data}
            mediaType={type as MediaType}
            isAdded={isAdded}
            onAdd={handleAdd}
            suggestions={suggestions}
            onSelectSuggestion={handleSelectSuggestion}
        />
    )
}