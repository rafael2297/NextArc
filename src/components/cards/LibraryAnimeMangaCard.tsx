import { useState, type MouseEvent, type ChangeEvent } from 'react'
import { Pencil, Trash2, Plus, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import type { AnimeStatus, ReadingStatus } from '../../store/useAppStore'
import { useSessionStore } from '../../store/useSessionStore'
import { useProfileController } from '../../hooks/useSettingsController'

const statusLabel = {
    watching: 'Assistindo',
    reading: 'Lendo',
    completed: 'Concluído',
    paused: 'Pausado',
    dropped: 'Abandonado',
    planned: 'Planejado',
} as const

type Props = {
    id: number
    title: string
    image: string
    current: number
    total: number
    type: 'anime' | 'manga'
    status: AnimeStatus | ReadingStatus
    isNSFW?: boolean

    onChangeStatus: (status: AnimeStatus | ReadingStatus) => void
    onChangeCurrent: (value: number) => void
    onChangeTotal: (value: number) => void
    onRemove: () => void
}

export default function LibraryAnimeMangaCard(props: Props) {
    const { profile } = useProfileController()
    const [editing, setEditing] = useState(false)

    // Puxando o nsfwMode correto da sua SessionStore
    const { nsfwMode } = useSessionStore()

    const {
        title,
        image,
        status,
        current,
        total,
        isNSFW = false,
        onChangeStatus,
        onChangeCurrent,
        onChangeTotal,
        onRemove,
    } = props

    // --- LÓGICA DE CORES DINÂMICAS ---
    const primaryColor = profile?.theme?.primary || '#3b82f6'
    const bgColor = profile?.theme?.background || '#000000'
    const isLight = bgColor.toLowerCase() === '#ffffff' || bgColor.toLowerCase() === 'white'

    // --- LÓGICA NSFW BASEADA NA SUA STORE ---
    const hideCard = isNSFW && nsfwMode === 'hide'
    const blurCard = isNSFW && nsfwMode === 'blur'

    const stop = (e: MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
    }

    const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
        onChangeStatus(e.target.value as AnimeStatus | ReadingStatus)
    }

    // Cores de status adaptativas
    const getStatusStyle = (s: string) => {
        switch (s) {
            case 'completed': return { bg: '#10b981', text: '#fff' }
            case 'paused': return { bg: '#f59e0b', text: '#000' }
            case 'dropped': return { bg: '#ef4444', text: '#fff' }
            case 'planned': return { bg: '#71717a', text: '#fff' }
            default: return { bg: primaryColor, text: '#fff' }
        }
    }

    const currentStatusStyle = getStatusStyle(status)

    // 🔴 Early return se o card deve ser ocultado
    if (hideCard) return null

    return (
        <div
            className="relative w-full backdrop-blur-md border rounded-[2rem] p-3 transition-all shadow-xl group"
            style={{
                backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.03)',
                borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'
            }}
        >
            {/* 🔞 Overlay NSFW (Apenas se o modo for 'blur') */}
            {blurCard && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl rounded-[2rem]">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                        Conteúdo Sensível
                    </span>
                </div>
            )}

            {/* CONTAINER DA IMAGEM */}
            <div className="relative h-56 w-full overflow-hidden rounded-[1.5rem] bg-zinc-950 shadow-inner">
                <img
                    src={image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-110"
                />

                <img
                    src={image}
                    alt={title}
                    className={`relative z-10 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 ${blurCard ? 'blur-2xl' : ''
                        }`}
                />

                <div className="absolute inset-0 z-20 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                {/* Badge de Status Dinâmico */}
                <span
                    className="absolute top-3 right-3 z-30 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg"
                    style={{ backgroundColor: currentStatusStyle.bg, color: currentStatusStyle.text }}
                >
                    {statusLabel[status]}
                </span>

                <div className="absolute bottom-4 left-4 right-4 z-30">
                    <h3 className="text-sm font-black text-white leading-tight uppercase tracking-tighter italic line-clamp-2 drop-shadow-md">
                        {title}
                    </h3>
                </div>
            </div>

            <div className="mt-5 px-1 pb-2">
                <AnimatePresence mode="wait">
                    {!editing ? (
                        <motion.div
                            key="view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                        >
                            <div className="flex justify-between items-end italic">
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.2em]">
                                        Progresso
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black tracking-tighter" style={{ color: isLight ? '#000' : '#fff' }}>
                                            {current}
                                        </span>
                                        <span className="text-xs text-zinc-500 font-bold">
                                            / {total || '∞'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={(e) => { stop(e); setEditing(true); }}
                                        className="p-2.5 rounded-xl transition-colors"
                                        style={{ backgroundColor: isLight ? '#e4e4e7' : '#18181b', color: isLight ? '#3f3f46' : '#a1a1aa' }}
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => { stop(e); onChangeCurrent(current + 1); }}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                                        style={{ backgroundColor: primaryColor, color: '#fff' }}
                                    >
                                        <Plus size={14} strokeWidth={4} />
                                        Próximo
                                    </button>
                                </div>
                            </div>

                            {/* Barra de Progresso Dinâmica */}
                            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: isLight ? '#e4e4e7' : '#18181b' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${Math.min((current / (total || 1)) * 100, 100)}%`,
                                    }}
                                    className="h-full"
                                    style={{
                                        backgroundColor: primaryColor,
                                        boxShadow: `0 0 10px ${primaryColor}60`
                                    }}
                                />
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="edit"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3"
                        >
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Atual</label>
                                    <input
                                        type="number"
                                        value={current}
                                        onClick={stop}
                                        onChange={(e) => onChangeCurrent(Number(e.target.value))}
                                        className="w-full border rounded-xl px-3 py-2 text-sm font-bold outline-none transition-colors"
                                        style={{
                                            backgroundColor: isLight ? '#fff' : '#09090b',
                                            borderColor: isLight ? '#e4e4e7' : '#27272a',
                                            color: isLight ? '#000' : '#fff'
                                        }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Total</label>
                                    <input
                                        type="number"
                                        value={total}
                                        onClick={stop}
                                        onChange={(e) => onChangeTotal(Number(e.target.value))}
                                        className="w-full border rounded-xl px-3 py-2 text-sm font-bold outline-none transition-colors"
                                        style={{
                                            backgroundColor: isLight ? '#fff' : '#09090b',
                                            borderColor: isLight ? '#e4e4e7' : '#27272a',
                                            color: isLight ? '#000' : '#fff'
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[8px] font-black text-zinc-500 uppercase ml-1 tracking-widest">Status</label>
                                <select
                                    value={status}
                                    onClick={stop}
                                    onChange={handleStatusChange}
                                    className="w-full border rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-tighter outline-none appearance-none"
                                    style={{
                                        backgroundColor: isLight ? '#fff' : '#09090b',
                                        borderColor: isLight ? '#e4e4e7' : '#27272a',
                                        color: isLight ? '#000' : '#fff'
                                    }}
                                >
                                    {(Object.keys(statusLabel) as Array<keyof typeof statusLabel>).map((key) => (
                                        <option key={key} value={key} className={isLight ? 'text-black' : 'bg-zinc-900 text-white'}>
                                            {statusLabel[key]}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={(e) => { stop(e); onRemove(); }}
                                    className="p-3 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { stop(e); setEditing(false); }}
                                    className="flex-1 py-2 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg"
                                    style={{ backgroundColor: isLight ? '#000' : '#fff', color: isLight ? '#fff' : '#000' }}
                                >
                                    <Check size={14} strokeWidth={4} />
                                    Confirmar
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}