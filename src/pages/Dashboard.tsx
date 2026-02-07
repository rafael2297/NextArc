import { motion } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import {
    Trophy,
    Coins,
    Package,
    Book,
    ArrowRight,
    Settings as SettingsIcon,
    TrendingUp,
    Star,
    MonitorPlay
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../routes/paths'
import { useMemo } from 'react'
import { useProfileController } from '../hooks/useSettingsController'

export default function Dashboard() {
    const navigate = useNavigate()
    const { xp, coins, inventory, animeList } = useAppStore()
    const { profile } = useProfileController()

    // --- LÓGICA DE CORES E BANNER ---
    const primaryColor = profile?.theme?.primary || '#6366f1'
    const bannerImage = profile?.banner || ''
    const bgColor = profile?.theme?.background || '#09090b'
    const isLight = bgColor.toLowerCase() === '#ffffff' || bgColor.toLowerCase() === 'white'

    // Lógica de Nível
    const level = Math.floor(xp / 100) + 1
    const progressToNextLevel = xp % 100

    // ESTATÍSTICAS REAIS
    const stats = useMemo(() => {
        const genreCounts: Record<string, number> = {}
        animeList?.forEach(anime => {
            anime.genres?.forEach((g: any) => {
                const name = typeof g === 'string' ? g : g.name
                genreCounts[name] = (genreCounts[name] || 0) + 1
            })
        })

        const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Nenhum'
        const rarityCounts = inventory.reduce((acc, card) => {
            acc[card.rarity] = (acc[card.rarity] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const topRarity = Object.entries(rarityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Nenhuma'

        return { topGenre, topRarity }
    }, [animeList, inventory])

    return (
        <div className="min-h-screen p-6 pb-32 transition-colors duration-500" style={{ backgroundColor: bgColor, color: isLight ? '#000' : '#fff' }}>

            {/* HEADER */}
            <header className="flex justify-between items-center mb-10 pt-8 max-w-5xl mx-auto">
                <div>
                    <span style={{ color: primaryColor }} className="font-black uppercase text-[10px] tracking-[0.3em]">Command Center</span>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter">Dashboard</h1>
                </div>

                <button
                    onClick={() => navigate(ROUTES.SETTINGS)}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl transition-all shadow-xl active:scale-90 border"
                    style={{
                        backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                        borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
                    }}
                >
                    <SettingsIcon size={20} />
                </button>
            </header>

            <div className="max-w-5xl mx-auto space-y-6">

                {/* CARD DE PROGRESSO (HERO) COM BANNER */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative p-8 rounded-[3rem] overflow-hidden shadow-2xl border transition-all"
                    style={{
                        backgroundColor: isLight ? '#fff' : '#121214',
                        borderColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
                    }}
                >
                    {/* Imagem de Banner de Fundo */}
                    {bannerImage && (
                        <div className="absolute inset-0 z-0">
                            <img src={bannerImage} className="w-full h-full object-cover opacity-20 blur-sm" alt="Banner" />
                            <div className="absolute inset-0 bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, ${bgColor}, transparent)` }} />
                        </div>
                    )}

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="absolute inset-0 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ backgroundColor: primaryColor }} />
                                <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center relative z-10 border-2" style={{ backgroundColor: bgColor, borderColor: primaryColor }}>
                                    <span className="text-4xl font-black italic">{level}</span>
                                    <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase text-white" style={{ backgroundColor: primaryColor }}>Level</div>
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter">Elite Rank</h2>
                                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{xp} XP Acumulados</p>
                            </div>
                        </div>

                        <div className="flex-1 max-w-md w-full">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Next Milestone</span>
                                <span className="font-black text-xs" style={{ color: primaryColor }}>{progressToNextLevel}%</span>
                            </div>
                            <div className="h-4 rounded-full border p-1" style={{ backgroundColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.4)', borderColor: isLight ? 'transparent' : 'rgba(255,255,255,0.05)' }}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressToNextLevel}%` }}
                                    className="h-full rounded-full shadow-lg"
                                    style={{
                                        backgroundColor: primaryColor,
                                        boxShadow: `0 0 15px ${primaryColor}60`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <TrendingUp className="absolute right-[-10%] bottom-[-10%] w-64 h-64 text-white/[0.02] -rotate-12 pointer-events-none" />
                </motion.div>

                {/* GRID DE ESTATÍSTICAS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        icon={<MonitorPlay style={{ color: primaryColor }} />}
                        label="Gênero Favorito"
                        value={stats.topGenre}
                        isLight={isLight}
                    />
                    <StatCard
                        icon={<Star className="text-yellow-500" />}
                        label="Main Rarity"
                        value={stats.topRarity}
                        isLight={isLight}
                    />
                    <StatCard
                        icon={<Trophy className="text-emerald-400" />}
                        label="Coleção Total"
                        value={`${inventory.length} Cards`}
                        isLight={isLight}
                    />
                    <StatCard
                        icon={<Coins className="text-orange-400" />}
                        label="Saldo Arc"
                        value={coins.toLocaleString()}
                        isLight={isLight}
                    />
                </div>

                {/* HUB DE AÇÕES */}
                <div className="space-y-4 pt-4">
                    <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.4em] ml-2">Quick Navigation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <NavButton
                            title="Card Shop"
                            subtitle="Adquirir Novos Packs"
                            icon={<Package size={24} />}
                            activeColor={primaryColor}
                            isLight={isLight}
                            onClick={() => navigate(ROUTES.SHOP)}
                        />
                        <NavButton
                            title="Meu Álbum"
                            subtitle="Gerenciar Coleção"
                            icon={<Book size={24} />}
                            activeColor={primaryColor}
                            isLight={isLight}
                            onClick={() => navigate(ROUTES.INVENTORY)}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ icon, label, value, isLight }: any) {
    return (
        <div
            className="p-5 rounded-[2rem] border backdrop-blur-md transition-all"
            style={{
                backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
            }}
        >
            <div className="mb-3">{icon}</div>
            <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider mb-1">{label}</p>
            <p className="text-sm font-black uppercase italic truncate">{value}</p>
        </div>
    )
}

function NavButton({ title, subtitle, icon, activeColor, isLight, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="group flex items-center justify-between p-6 border rounded-[2.5rem] transition-all active:scale-95 overflow-hidden relative"
            style={{
                backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
                borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
            }}
        >
            <div className="flex items-center gap-5 relative z-10">
                <div
                    className="p-4 rounded-2xl group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${activeColor}20`, color: activeColor }}
                >
                    {icon}
                </div>
                <div className="text-left">
                    <h4 className="font-black uppercase italic text-lg leading-none">{title}</h4>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1 tracking-widest">{subtitle}</p>
                </div>
            </div>
            <ArrowRight size={20} className="text-zinc-500 group-hover:translate-x-1 transition-all relative z-10" />
            <div className="absolute right-0 top-0 w-32 h-32 opacity-[0.05] blur-3xl rounded-full" style={{ backgroundColor: activeColor }} />
        </button>
    )
}