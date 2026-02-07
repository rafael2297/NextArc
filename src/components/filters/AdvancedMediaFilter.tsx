import React, { useState, useMemo, useRef, useEffect } from 'react'
import { X, Hash, Zap, Check, Search, ChevronDown, Filter, Monitor, Star, Trophy, ArrowUpNarrowWide, ArrowDownWideNarrow } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfileStore } from '../../store/useProfileStore'
import { hexToRgba, getContrastColor, getBorderColor } from '../../utils/colors'

interface TagItem {
    mal_id: number | string
    name: string
}

type FilterMode = 'AND' | 'OR'
type OrderBy = 'score' | 'rank' | 'popularity' | 'title'
type SortDir = 'asc' | 'desc'

interface Props {
    search?: string
    selectedGenres: number[]
    selectedDemographics: number[]
    selectedFormats?: string[]
    mode: FilterMode
    orderBy?: OrderBy
    sort?: SortDir
    minScore?: number
    genres: TagItem[]
    demographics: TagItem[]
    searchType: 'anime' | 'manga'
    onChange: (filters: Partial<{
        search: string
        genres: number[]
        demographics: number[]
        mode: FilterMode
        formats: string[]
        orderBy: OrderBy
        sort: SortDir
        minScore: number
    }>) => void
    onClear?: () => void
}

const FORMAT_OPTIONS = {
    anime: ['tv', 'movie', 'ova', 'special', 'ona', 'music'],
    manga: ['manga', 'novel', 'lightnovel', 'oneshot', 'doujin', 'manhwa', 'manhua']
}

function AdvancedMediaFilter({
    selectedGenres,
    selectedDemographics,
    selectedFormats = [],
    mode,
    orderBy = 'score',
    sort = 'desc',
    minScore = 0,
    genres,
    demographics,
    searchType,
    onChange,
    onClear,
}: Props) {
    const [openDropdown, setOpenDropdown] = useState<'genres' | 'demos' | 'formats' | 'order' | null>(null)
    const [genreQuery, setGenreQuery] = useState('')
    const [demoQuery, setDemoQuery] = useState('')

    const dropdownRef = useRef<HTMLDivElement>(null)
    const theme = useProfileStore((state) => state.profile.theme)

    const textColor = getContrastColor(theme.background)
    const subTextColor = hexToRgba(textColor, 0.5)
    const borderColor = getBorderColor(theme.background)
    const contrastOnPrimary = getContrastColor(theme.primary)
    const borderOnPrimary = contrastOnPrimary === '#000000' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleInt = (list: number[], id: number) =>
        list.includes(id) ? list.filter(v => v !== id) : [...list, id]

    const toggleStr = (list: string[], val: string) =>
        list.includes(val) ? list.filter(v => v !== val) : [...list, val]

    const uniqueGenres = useMemo(() => {
        const map = new Map();
        (genres || []).forEach(g => map.set(g.mal_id, g));
        return Array.from(map.values()).filter(g => (g as any).name.toLowerCase().includes(genreQuery.toLowerCase()));
    }, [genres, genreQuery]);

    const uniqueDemos = useMemo(() => {
        const map = new Map();
        (demographics || []).forEach(d => map.set(d.mal_id, d));
        return Array.from(map.values()).filter(d => (d as any).name.toLowerCase().includes(demoQuery.toLowerCase()));
    }, [demographics, demoQuery]);

    return (
        <div className="space-y-6 relative z-[100] overflow-visible" ref={dropdownRef}>
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: borderColor }}>
                <div className="flex items-center gap-2">
                    <Zap size={14} style={{ color: theme.primary, fill: theme.primary }} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: textColor }}>
                        Filtros Avançados
                    </span>
                </div>
                {onClear && (
                    <button type="button" onClick={onClear} className="text-[9px] font-black transition-colors flex items-center gap-1 italic" style={{ color: subTextColor }}>
                        <X size={12} /> Limpar Filtros
                    </button>
                )}
            </div>

            {/* Primeira Linha: Modo, Gêneros, Públicos e Formatos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-visible">
                {/* Seletor de Modo */}
                <div className="p-1 rounded-2xl border flex h-12" style={{ backgroundColor: hexToRgba(theme.background, 0.5), borderColor: borderColor }}>
                    {(['AND', 'OR'] as const).map(m => (
                        <button key={m} type="button" onClick={() => onChange({ mode: m })} className="flex-1 rounded-xl text-[9px] font-black transition-all border"
                            style={{
                                backgroundColor: mode === m ? theme.primary : 'transparent',
                                color: mode === m ? contrastOnPrimary : subTextColor,
                                borderColor: mode === m ? borderOnPrimary : 'transparent'
                            }}>
                            {m === 'AND' ? 'ESTRITO' : 'FLEXÍVEL'}
                        </button>
                    ))}
                </div>

                {/* Dropdowns */}
                {[
                    { id: 'genres', label: 'Gêneros', icon: Hash, list: uniqueGenres, selected: selectedGenres },
                    { id: 'demos', label: 'Público', icon: Filter, list: uniqueDemos, selected: selectedDemographics },
                    { id: 'formats', label: 'Formato', icon: Monitor, list: FORMAT_OPTIONS[searchType].map(f => ({ mal_id: f, name: f.toUpperCase() })), selected: selectedFormats }
                ].map((drop) => (
                    <div className="relative overflow-visible" key={drop.id}>
                        <button
                            type="button"
                            onClick={() => setOpenDropdown(openDropdown === drop.id ? null : drop.id as any)}
                            className="w-full h-12 px-4 rounded-2xl border transition-all flex items-center justify-between text-[10px] font-black uppercase tracking-widest pointer-events-auto"
                            style={{
                                borderColor: openDropdown === drop.id ? theme.primary : borderColor,
                                backgroundColor: hexToRgba(theme.background, 0.5),
                                color: openDropdown === drop.id ? theme.primary : textColor
                            }}
                        >
                            <span className="flex items-center gap-2"><drop.icon size={14} /> {drop.label} ({drop.selected.length})</span>
                            <ChevronDown size={14} className={`transition-transform ${openDropdown === drop.id ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {openDropdown === drop.id && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                    className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[260px] border rounded-2xl shadow-2xl p-3 space-y-3 z-[9999] pointer-events-auto"
                                    style={{ backgroundColor: theme.navbar, borderColor: borderColor }}
                                >
                                    {drop.id !== 'formats' && (
                                        <div className="relative" onClick={e => e.stopPropagation()}>
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: subTextColor }} />
                                            <input
                                                autoFocus
                                                className="w-full border rounded-xl py-2.5 pl-9 pr-4 text-xs outline-none"
                                                style={{ backgroundColor: theme.background, borderColor: borderColor, color: textColor }}
                                                placeholder="Buscar..."
                                                value={drop.id === 'genres' ? genreQuery : demoQuery}
                                                onChange={e => drop.id === 'genres' ? setGenreQuery(e.target.value) : setDemoQuery(e.target.value)}
                                            />
                                        </div>
                                    )}
                                    <div className="max-h-64 overflow-y-auto pr-1 custom-scrollbar flex flex-col gap-1">
                                        {drop.list.map((item: any) => {
                                            const isSelected = (drop.selected as any[]).includes(item.mal_id);
                                            return (
                                                <button
                                                    key={item.mal_id}
                                                    type="button"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();

                                                        if (drop.id === 'formats') {
                                                            onChange({ formats: toggleStr(selectedFormats, item.mal_id.toString()) });
                                                        } else if (drop.id === 'genres') {
                                                            onChange({ genres: toggleInt(selectedGenres, Number(item.mal_id)) });
                                                        } else {
                                                            onChange({ demographics: toggleInt(selectedDemographics, Number(item.mal_id)) });
                                                        }
                                                    }}
                                                    className="w-full flex items-center justify-between p-3 rounded-xl text-[10px] font-black border transition-all"
                                                    style={{
                                                        backgroundColor: isSelected ? theme.primary : 'transparent',
                                                        color: isSelected ? contrastOnPrimary : textColor,
                                                        borderColor: isSelected ? borderOnPrimary : 'transparent'
                                                    }}
                                                >
                                                    {item.name} {isSelected && <Check size={14} strokeWidth={4} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {/* Segunda Linha: Ordenação e Nota Mínima */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                {/* Nota Mínima */}
                <div className="space-y-2">
                    <div className="flex justify-between px-1">
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: subTextColor }}>Nota Mínima</span>
                        <span className="text-[10px] font-black" style={{ color: theme.primary }}>{minScore > 0 ? minScore : 'Qualquer'}</span>
                    </div>
                    <input
                        type="range" min="0" max="9" step="1"
                        value={minScore}
                        onChange={(e) => onChange({ minScore: Number(e.target.value) })}
                        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                        style={{ backgroundColor: borderColor, accentColor: theme.primary }}
                    />
                </div>

                {/* Ordenar Por */}
                <div className="p-1 rounded-2xl border flex h-12" style={{ backgroundColor: hexToRgba(theme.background, 0.5), borderColor: borderColor }}>
                    {[
                        { id: 'score', label: 'Nota', icon: Star },
                        { id: 'rank', label: 'Rank', icon: Trophy }
                    ].map(opt => (
                        <button key={opt.id} type="button" onClick={() => onChange({ orderBy: opt.id as OrderBy })}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl text-[9px] font-black transition-all"
                            style={{
                                backgroundColor: orderBy === opt.id ? theme.primary : 'transparent',
                                color: orderBy === opt.id ? contrastOnPrimary : subTextColor
                            }}>
                            <opt.icon size={12} /> {opt.label}
                        </button>
                    ))}
                </div>

                {/* Direção (Crescente/Decrescente) */}
                <div className="p-1 rounded-2xl border flex h-12" style={{ backgroundColor: hexToRgba(theme.background, 0.5), borderColor: borderColor }}>
                    <button type="button" onClick={() => onChange({ sort: 'desc' })} className="flex-1 flex items-center justify-center gap-2 rounded-xl text-[9px] font-black transition-all"
                        style={{
                            backgroundColor: sort === 'desc' ? theme.primary : 'transparent',
                            color: sort === 'desc' ? contrastOnPrimary : subTextColor
                        }}>
                        <ArrowDownWideNarrow size={14} /> Maior
                    </button>
                    <button type="button" onClick={() => onChange({ sort: 'asc' })} className="flex-1 flex items-center justify-center gap-2 rounded-xl text-[9px] font-black transition-all"
                        style={{
                            backgroundColor: sort === 'asc' ? theme.primary : 'transparent',
                            color: sort === 'asc' ? contrastOnPrimary : subTextColor
                        }}>
                        <ArrowUpNarrowWide size={14} /> Menor
                    </button>
                </div>
            </div>

            {/* Chips Selecionados */}
            {(selectedGenres.length > 0 || selectedDemographics.length > 0 || selectedFormats.length > 0 || minScore > 0) && (
                <div className="flex flex-wrap gap-2 pt-2">
                    {minScore > 0 && <FilterChip label={`Nota > ${minScore}`} onRemove={() => onChange({ minScore: 0 })} theme={theme} />}
                    {uniqueGenres.filter(g => selectedGenres.includes(g.mal_id as number)).map(tag => (
                        <FilterChip key={`g-${tag.mal_id}`} label={tag.name} onRemove={() => onChange({ genres: selectedGenres.filter(id => id !== tag.mal_id) })} theme={theme} />
                    ))}
                    {uniqueDemos.filter(d => selectedDemographics.includes(d.mal_id as number)).map(tag => (
                        <FilterChip key={`d-${tag.mal_id}`} label={tag.name} onRemove={() => onChange({ demographics: selectedDemographics.filter(id => id !== tag.mal_id) })} theme={theme} />
                    ))}
                    {selectedFormats.map(f => (
                        <FilterChip key={`f-${f}`} label={f} onRemove={() => onChange({ formats: selectedFormats.filter(val => val !== f) })} theme={theme} />
                    ))}
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { 
                    background: ${theme.primary}; 
                    border-radius: 10px; 
                }
            `}} />
        </div>
    )
}

function FilterChip({ label, onRemove, theme }: { label: string, onRemove: () => void, theme: any }) {
    const contrast = getContrastColor(theme.primary);
    return (
        <div className="flex items-center gap-2 border px-3 py-1.5 rounded-full text-[9px] font-black uppercase shadow-sm"
            style={{ backgroundColor: theme.primary, color: contrast, borderColor: 'rgba(0,0,0,0.1)' }}>
            {label}
            <X size={12} className="cursor-pointer hover:scale-110 transition-transform" onClick={onRemove} />
        </div>
    )
}

export default React.memo(AdvancedMediaFilter);