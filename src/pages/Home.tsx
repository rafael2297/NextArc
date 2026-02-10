import {
  Play,
  BookOpen,
  Star,
  Activity,
  Zap,
  LayoutGrid,
  ChevronRight,
  Plus,
  PlayCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

import { useAppStore } from '../store/useAppStore'
import { useProfileStore } from '../store/useProfileStore'
import HomeActivityCard from '../components/cards/HomeActivityCard'
import { ROUTES } from '../routes/paths'
import { hexToRgba, getContrastColor } from '../utils/colors'

export default function Home() {
  const navigate = useNavigate()
  const { animeList, mangaList, inventory } = useAppStore()
  const profile = useProfileStore((state) => state.profile)
  const theme = profile.theme

  const textColor = getContrastColor(theme.background)
  const subTextColor = hexToRgba(textColor, 0.6)

  // --- LÓGICA: CONTINUAR ASSISTINDO ---
  // Filtra itens em andamento e ordena pelo acesso mais recente
  const lastWatched = [...animeList, ...mangaList]
    .filter(item => {
      const progress = item.type === 'anime' ? item.currentEpisode : (item as any).currentChapter;
      return progress > 0 && item.status !== 'completed';
    })
    .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];

  const watchingCount = animeList.filter((a) => a.status === 'watching').length
  const readingCount = mangaList.filter((m) => m.status === 'reading').length
  const completedCount =
    animeList.filter((a) => a.status === 'completed').length +
    mangaList.filter((m) => m.status === 'completed').length

  const recentActivity = [...animeList, ...mangaList]
    .filter((item) => item.updatedAt)
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
    .slice(0, 4)

  return (
    <div className="flex-1">
      {/* SEÇÃO HERO COM BANNER DINÂMICO */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-[400px] md:h-[450px] overflow-hidden flex items-end pb-16 px-6"
      >
        {profile.banner ? (
          <img
            src={profile.banner}
            className="absolute inset-0 w-full h-full object-cover"
            alt="Banner"
          />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: theme.navbar }} />
        )}

        <div
          className="absolute inset-0 bg-gradient-to-t transition-colors duration-700"
          style={{
            backgroundImage: `linear-gradient(to top, ${theme.background} 5%, ${hexToRgba(theme.background, 0.2)} 60%, transparent 100%)`
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto w-full flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-md"
              style={{
                backgroundColor: hexToRgba(theme.primary, 0.1),
                borderColor: hexToRgba(theme.primary, 0.2)
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: theme.primary }} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] italic" style={{ color: theme.primary }}>
                Sistema Online v2.0
              </span>
            </div>

            <div>
              <h1
                className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.8] mb-2"
                style={{ color: textColor }}
              >
                EXPLORE O <br />
                <span
                  className="text-transparent bg-clip-text"
                  style={{ backgroundImage: `linear-gradient(to right, ${theme.primary}, ${textColor})` }}
                >
                  MULTIVERSO.
                </span>
              </h1>
              <p className="font-bold text-sm italic leading-relaxed" style={{ color: subTextColor }}>
                Bem-vindo de volta, <span style={{ color: textColor }}>{profile.name || 'Viajante'}</span>.
              </p>
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.05, rotate: 0 }}
            onClick={() => navigate(ROUTES.PROFILE)}
            className="relative cursor-pointer group shrink-0 hidden md:block"
          >
            <div
              className="absolute -inset-1 rounded-[2.8rem] blur opacity-25 group-hover:opacity-60 transition duration-700"
              style={{ backgroundColor: theme.primary }}
            />
            <div
              className="relative h-32 w-32 rounded-[2.5rem] border-2 border-white/10 p-1.5 rotate-3 group-hover:rotate-0 transition-transform duration-500 shadow-2xl"
              style={{ backgroundColor: theme.navbar }}
            >
              {profile.avatar ? (
                <img src={profile.avatar} className="h-full w-full rounded-[2.2rem] object-cover" alt="avatar" />
              ) : (
                <div className="h-full w-full flex items-center justify-center rounded-[2.2rem]" style={{ backgroundColor: hexToRgba(theme.primary, 0.1) }}>
                  <Zap style={{ color: theme.primary }} size={40} />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="max-w-6xl mx-auto px-4 relative z-20 pb-10 space-y-10">

        {/* GRID DE ESTATÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-[-40px]">
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={<Play size={22} style={{ color: theme.primary }} />} label="Animes" value={watchingCount} accentColor={theme.primary} />
            <StatCard icon={<BookOpen size={22} className="text-emerald-500" />} label="Mangás" value={readingCount} accentColor="#10b981" />
            <StatCard icon={<Star size={22} className="text-pink-500" />} label="Completos" value={completedCount} accentColor="#ec4899" />
          </div>

          <motion.button
            whileHover={{ y: -5 }}
            onClick={() => navigate(ROUTES.INVENTORY)}
            className="relative overflow-hidden border p-5 rounded-[2.5rem] flex flex-col justify-between group h-full backdrop-blur-xl transition-colors"
            style={{
              backgroundColor: hexToRgba(theme.navbar, 0.5),
              borderColor: hexToRgba(textColor, 0.1),
              color: textColor
            }}
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <LayoutGrid size={60} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest italic mb-1" style={{ color: subTextColor }}>
                Inventário
              </p>
              <h3 className="text-lg font-black italic uppercase">Cartas</h3>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="font-black text-xl" style={{ color: theme.primary }}>
                {inventory.length}
              </span>
              <div
                className="p-2 rounded-full shadow-lg"
                style={{
                  backgroundColor: theme.primary,
                  color: getContrastColor(theme.primary)
                }}
              >
                <ChevronRight size={16} />
              </div>
            </div>
          </motion.button>
        </div>

        {/* --- SEÇÃO CONTINUAR ASSISTINDO (NOVO) --- */}
        {lastWatched && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden border p-1 rounded-[3rem] group"
            style={{
              backgroundColor: hexToRgba(theme.navbar, 0.4),
              borderColor: hexToRgba(theme.primary, 0.2)
            }}
          >
            <div className="flex flex-col md:flex-row items-center gap-6 p-4">
              <div className="relative h-32 w-full md:w-56 shrink-0 overflow-hidden rounded-[2.2rem]">
                <img
                  src={lastWatched.cover}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  alt={lastWatched.title}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayCircle size={40} style={{ color: theme.primary }} />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] italic" style={{ color: theme.primary }}>
                  Continuar de onde parou
                </p>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-tight" style={{ color: textColor }}>
                  {lastWatched.title}
                </h3>
                <p className="text-sm font-bold italic" style={{ color: subTextColor }}>
                  {lastWatched.type === 'anime'
                    ? `Parou no Episódio ${lastWatched.currentEpisode}`
                    : `Parou no Capítulo ${(lastWatched as any).currentChapter}`}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/media/${lastWatched.type}/${lastWatched.id}`)}
                className="px-8 py-4 rounded-full font-black italic uppercase text-xs tracking-widest shadow-xl transition-all"
                style={{
                  backgroundColor: theme.primary,
                  color: getContrastColor(theme.primary)
                }}
              >
                Retomar {lastWatched.type === 'anime' ? 'Ep' : 'Cap'} {(lastWatched.type === 'anime' ? lastWatched.currentEpisode : (lastWatched as any).currentChapter) + 1}
              </motion.button>
            </div>
          </motion.section>
        )}

        {/* ATIVIDADE RECENTE */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 border border-white/5 rounded-2xl shadow-xl backdrop-blur-md"
                style={{ backgroundColor: hexToRgba(theme.navbar, 0.5) }}
              >
                <Activity size={20} style={{ color: theme.primary }} />
              </div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] italic" style={{ color: textColor }}>Atividade Recente</h2>
            </div>
            <div className="h-px flex-1 mx-8" style={{ backgroundColor: hexToRgba(textColor, 0.1) }} />
          </div>

          {recentActivity.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {recentActivity.map((item) => (
                <HomeActivityCard
                  key={`${item.type}-${item.id}`}
                  id={item.id}
                  title={item.title}
                  image={item.cover}
                  type={item.type}
                  format={item.format}
                  addedAt={item.updatedAt ?? item.addedAt}
                />
              ))}
            </div>
          ) : (
            <div
              onClick={() => navigate(ROUTES.SEARCH)}
              className="group cursor-pointer border-2 border-dashed rounded-[3rem] py-16 flex flex-col items-center justify-center transition-all"
              style={{
                backgroundColor: hexToRgba(theme.navbar, 0.2),
                borderColor: hexToRgba(theme.primary, 0.2)
              }}
            >
              <div className="p-4 rounded-full mb-4 group-hover:scale-110 transition-transform" style={{ backgroundColor: theme.navbar }}>
                <Plus size={32} style={{ color: theme.primary }} />
              </div>
              <p className="font-black uppercase text-[10px] tracking-widest italic" style={{ color: subTextColor }}>
                Sua lista está vazia. Comece a explorar!
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, accentColor }: { icon: React.ReactNode; label: string; value: number; accentColor: string }) {
  const theme = useProfileStore((state) => state.profile.theme)
  const textColor = getContrastColor(theme.background)
  const subTextColor = hexToRgba(textColor, 0.5)

  return (
    <div
      className="backdrop-blur-xl border p-6 rounded-[2.5rem] flex items-center gap-6 shadow-2xl group transition-all"
      style={{
        backgroundColor: hexToRgba(theme.navbar, 0.5),
        borderColor: hexToRgba(accentColor, 0.2)
      }}
    >
      <div
        className="h-14 w-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner"
        style={{ backgroundColor: theme.background }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest italic" style={{ color: subTextColor }}>{label}</p>
        <p className="text-3xl font-black tracking-tighter leading-none mt-1" style={{ color: textColor }}>
          {value.toString().padStart(2, '0')}
        </p>
      </div>
    </div>
  )
}