import {
    Trash2,
    Database,
    EyeOff,
    Eye,
    Droplets,
    PlayCircle,
    CheckCircle2,
    BookOpen,
    ArrowLeft,
    Palette,
    Pipette,
    ChevronDown,
    Settings2,
    Check,
    Image as ImageIcon,
    X,
    CloudUpload,
    RefreshCw,
    AlertCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { AccountSection } from '../components/profile/AccountSection'
import { useProfileController } from '../hooks/useSettingsController'
import { useSessionStore } from '../store/useSessionStore'
import { ROUTES } from '../routes/paths'
import { hexToRgba } from '../utils/colors'
import { useToast } from '../components/toast/useToast'

export default function Settings() {
    const navigate = useNavigate()
    const { showToast } = useToast()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const bannerInputRef = useRef<HTMLInputElement>(null)
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
    const [isSelectOpen, setIsSelectOpen] = useState(false)

    const {
        profile,
        driveEnabled,
        connectGoogle,
        disconnectGoogle,
        enableDrive,
        exportToDrive,
        restoreFromDrive,
        deleteAccount,
        animeList,
        mangaList,
        exportProfileJson,
        importProfile,
        isSaving,
        updateSpecificColor,
        updateFullTheme,
        updateBannerImage
    } = useProfileController()

    const { nsfwMode, setNSFWMode } = useSessionStore()

    // Lógica para detectar se o token parece expirado ou inválido
    const isTokenInvalid = !profile.accessToken || profile.accessToken.includes('nesxtarc://');

    const currentTheme = {
        primary: profile?.theme?.primary || '#3b82f6',
        background: profile?.theme?.background || '#000000',
        navbar: profile?.theme?.navbar || '#111111'
    };

    const isLight = currentTheme.background.toLowerCase() === '#ffffff' || currentTheme.background.toLowerCase() === 'white';

    const handleRemoveBanner = () => {
        updateBannerImage(null);
    };

    // Função aprimorada para Backup Manual
    const handleManualBackup = async () => {
        if (isSaving) return;

        if (isTokenInvalid) {
            console.log("Sessão expirada, abrindo Google Auth direto...");
            await connectGoogle();
            return;
        }

        try {
            await exportToDrive();
        } catch (err) {
            console.error("Erro no backup manual:", err);
        }
    };

    const themePresets = [
        { name: 'Cyber Blue', colors: { primary: '#3b82f6', background: '#000000', navbar: '#111111' } },
        { name: 'Pure White', colors: { primary: '#3b82f6', background: '#ffffff', navbar: '#f4f4f5' } },
        { name: 'Tokyo Night', colors: { primary: '#7aa2f7', background: '#1a1b26', navbar: '#16161e' } },
        { name: 'Midnight Purple', colors: { primary: '#a855f7', background: '#0f0a1a', navbar: '#1a1429' } },
        { name: 'Sakura Pink', colors: { primary: '#ff85a2', background: '#1a0f12', navbar: '#2a1a1e' } },
        { name: 'Emerald Forest', colors: { primary: '#10b981', background: '#060d0b', navbar: '#0d1a16' } },
        { name: 'Solar Orange', colors: { primary: '#f97316', background: '#0f0d0b', navbar: '#1a1612' } },
        { name: 'Vampire Red', colors: { primary: '#e11d48', background: '#0a0000', navbar: '#1a0505' } },
    ]

    const stats = [
        { label: 'Assistindo', value: animeList?.filter(a => a.status === 'watching').length || 0, icon: PlayCircle },
        { label: 'Completos', value: (animeList?.filter(a => a.status === 'completed').length || 0) + (mangaList?.filter(m => m.status === 'completed').length || 0), icon: CheckCircle2 },
        { label: 'Lendo Mangá', value: mangaList?.filter(m => m.status === 'reading').length || 0, icon: BookOpen },
    ]

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen pb-32 overflow-x-hidden relative transition-colors duration-500"
            style={{ backgroundColor: currentTheme.background, color: isLight ? '#121212' : '#ffffff' }}
        >
            <input type="file" ref={fileInputRef} onChange={importProfile} className="hidden" accept=".json" />
            <input type="file" ref={bannerInputRef} onChange={(e) => e.target.files?.[0] && updateBannerImage(e.target.files[0])} className="hidden" accept="image/*" />

            {/* BOTÃO VOLTAR */}
            <div className="fixed top-20 left-6 z-[9999]">
                <button
                    onClick={() => navigate(ROUTES.PROFILE)}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl shadow-2xl active:scale-90 transition-all border"
                    style={{
                        backgroundColor: isLight ? '#f4f4f5' : '#111111',
                        borderColor: isLight ? '#e4e4e7' : 'rgba(255,255,255,0.1)',
                        color: isLight ? '#000' : '#fff'
                    }}
                >
                    <ArrowLeft size={24} />
                </button>
            </div>

            {/* HEADER DESIGN */}
            <div className="relative h-[350px] flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    {profile.banner ? (
                        <img src={profile.banner} className="w-full h-full object-cover opacity-30" alt="Banner" />
                    ) : (
                        <div className="w-full h-full" style={{ backgroundColor: currentTheme.background }} />
                    )}
                    <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(to bottom, transparent, ${currentTheme.background})` }} />
                </div>
                <div className="relative z-10 text-center flex flex-col items-center">
                    <img
                        src={profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}`}
                        className="w-24 h-24 rounded-[2rem] object-cover border-4 shadow-2xl"
                        style={{ borderColor: isLight ? '#fff' : '#111' }}
                        alt="Avatar"
                    />
                    <h1 className="mt-4 text-2xl font-black italic uppercase tracking-tighter" style={{ color: isLight ? '#000' : '#fff' }}>
                        {profile.name}
                    </h1>
                </div>
            </div>

            <div className="px-5 -mt-10 space-y-6 relative z-20 max-w-2xl mx-auto">

                {/* STATS */}
                <section className="grid grid-cols-3 gap-3">
                    {stats.map((stat, i) => (
                        <div key={i} className="backdrop-blur-md border p-4 rounded-[1.5rem] text-center"
                            style={{
                                backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                                borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)'
                            }}>
                            <stat.icon size={16} className="mx-auto mb-1" style={{ color: currentTheme.primary }} />
                            <p className="text-xl font-black" style={{ color: isLight ? '#000' : '#fff' }}>{stat.value}</p>
                            <p className="text-[7px] uppercase tracking-widest text-zinc-500 font-bold">{stat.label}</p>
                        </div>
                    ))}
                </section>

                {/* PERSONALIZAÇÃO */}
                <section
                    className="backdrop-blur-xl border p-6 rounded-[2rem] shadow-2xl relative"
                    style={{
                        backgroundColor: isLight ? '#ffffff' : 'rgba(24, 24, 27, 0.4)',
                        borderColor: isLight ? '#e4e4e7' : 'rgba(63, 63, 70, 0.5)',
                        zIndex: isSelectOpen ? 50 : 1
                    }}
                >
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <Palette size={18} style={{ color: currentTheme.primary }} />
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Estilo do App</h3>
                    </div>

                    <div className="space-y-3 mb-8">
                        <label className="text-[9px] font-black uppercase text-zinc-500 ml-2 tracking-widest">Imagem de Capa (Banner)</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => bannerInputRef.current?.click()}
                                className="flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all active:scale-95"
                                style={{
                                    backgroundColor: isLight ? '#f4f4f5' : '#09090b',
                                    borderColor: isLight ? '#e4e4e7' : '#27272a',
                                    color: isLight ? '#000' : '#fff'
                                }}
                            >
                                <ImageIcon size={18} style={{ color: currentTheme.primary }} />
                                <span className="text-xs font-bold uppercase tracking-tight">Alterar Banner</span>
                            </button>

                            {profile.banner && (
                                <button
                                    onClick={handleRemoveBanner}
                                    className="w-14 flex items-center justify-center rounded-2xl border transition-all active:scale-90 hover:bg-red-500/10"
                                    style={{
                                        backgroundColor: isLight ? '#f4f4f5' : '#09090b',
                                        borderColor: 'rgba(239, 68, 68, 0.2)',
                                        color: '#ef4444'
                                    }}
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* PRESETS DROPDOWN */}
                    <div className="space-y-2 mb-8 relative">
                        <label className="text-[9px] font-black uppercase text-zinc-500 ml-2 tracking-widest">Presets de Estilo</label>
                        <button
                            onClick={() => setIsSelectOpen(!isSelectOpen)}
                            className="w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300"
                            style={{
                                backgroundColor: isLight ? '#f4f4f5' : '#09090b',
                                borderColor: isSelectOpen ? currentTheme.primary : (isLight ? '#e4e4e7' : '#27272a'),
                                color: isLight ? '#000' : '#fff'
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full border-2 border-white/10" style={{ backgroundColor: currentTheme.primary }} />
                                <span className="text-sm font-bold uppercase tracking-tight">
                                    {themePresets.find(t => t.colors.background === currentTheme.background)?.name || "Personalizado"}
                                </span>
                            </div>
                            <motion.div animate={{ rotate: isSelectOpen ? 180 : 0 }}>
                                <ChevronDown size={20} className="text-zinc-500" />
                            </motion.div>
                        </button>

                        <AnimatePresence>
                            {isSelectOpen && (
                                <>
                                    <div className="fixed inset-0 z-[100]" onClick={() => setIsSelectOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 5, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        className="absolute left-0 right-0 z-[101] overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-xl"
                                        style={{
                                            backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(15, 15, 15, 0.95)',
                                            borderColor: isLight ? '#e4e4e7' : '#27272a'
                                        }}
                                    >
                                        <div className="max-h-[250px] overflow-y-auto p-2 space-y-1">
                                            {themePresets.map((t) => {
                                                const isActive = currentTheme.background === t.colors.background;
                                                return (
                                                    <button
                                                        key={t.name}
                                                        onClick={() => {
                                                            updateFullTheme(t.colors);
                                                            setIsSelectOpen(false);
                                                        }}
                                                        className="w-full flex items-center justify-between p-3 rounded-xl transition-all"
                                                        style={{
                                                            backgroundColor: isActive ? hexToRgba(t.colors.primary, 0.1) : 'transparent'
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative">
                                                                <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: t.colors.background }} />
                                                                <div className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full border-2"
                                                                    style={{ backgroundColor: t.colors.primary, borderColor: isLight ? '#fff' : '#0f0f0f' }} />
                                                            </div>
                                                            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: isLight ? '#121212' : '#eee' }}>
                                                                {t.name}
                                                            </span>
                                                        </div>
                                                        {isActive && <Check size={16} style={{ color: t.colors.primary }} />}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* CORES MANUAIS */}
                    <div className="border-t pt-4" style={{ borderColor: isLight ? '#f4f4f5' : 'rgba(255,255,255,0.05)' }}>
                        <button onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="w-full flex items-center justify-between px-2 py-2">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ajuste Manual</span>
                            </div>
                            <motion.div animate={{ rotate: isAdvancedOpen ? 180 : 0 }}>
                                <ChevronDown size={16} className="text-zinc-500" />
                            </motion.div>
                        </button>

                        <AnimatePresence>
                            {isAdvancedOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="space-y-3 pt-4 px-2">
                                        {[
                                            { label: 'Fundo', key: 'background' as const },
                                            { label: 'Menus', key: 'navbar' as const },
                                            { label: 'Destaque', key: 'primary' as const },
                                        ].map((item) => (
                                            <div key={item.key} className="flex items-center justify-between p-3 rounded-xl border"
                                                style={{
                                                    backgroundColor: isLight ? '#fafafa' : 'rgba(0,0,0,0.2)',
                                                    borderColor: isLight ? '#f4f4f5' : 'rgba(255,255,255,0.05)'
                                                }}>
                                                <span className="text-[10px] font-bold text-zinc-400 uppercase">{item.label}</span>
                                                <label className="relative cursor-pointer flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-lg border border-white/10" style={{ backgroundColor: currentTheme[item.key] }} />
                                                    <input type="color" value={currentTheme[item.key]} onChange={(e) => updateSpecificColor(item.key, e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                {/* PRIVACIDADE */}
                <section className="backdrop-blur-xl border p-6 rounded-[2rem]"
                    style={{
                        backgroundColor: isLight ? '#ffffff' : 'rgba(24, 24, 27, 0.4)',
                        borderColor: isLight ? '#e4e4e7' : 'rgba(63, 63, 70, 0.5)'
                    }}>
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <EyeOff size={18} className="text-rose-500" />
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Conteúdo Sensível</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {['hide', 'blur', 'show'].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setNSFWMode(mode as any)}
                                className="p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all"
                                style={{
                                    backgroundColor: nsfwMode === mode ? hexToRgba(currentTheme.primary, 0.1) : (isLight ? '#f4f4f5' : '#09090b'),
                                    borderColor: nsfwMode === mode ? currentTheme.primary : (isLight ? '#e4e4e7' : '#27272a'),
                                    color: nsfwMode === mode ? currentTheme.primary : '#71717a'
                                }}
                            >
                                {mode === 'hide' ? <EyeOff size={20} /> : mode === 'blur' ? <Droplets size={20} /> : <Eye size={20} />}
                                <span className="text-[8px] font-black uppercase tracking-widest">{mode}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* SINCRONIZAÇÃO */}
                <section className="backdrop-blur-xl border rounded-[2rem] p-6 space-y-4"
                    style={{
                        backgroundColor: isLight ? '#ffffff' : 'rgba(24, 24, 27, 0.4)',
                        borderColor: isLight ? '#e4e4e7' : 'rgba(63, 63, 70, 0.5)'
                    }}>

                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <Database size={20} style={{ color: isTokenInvalid ? '#f59e0b' : currentTheme.primary }} />
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-tight" style={{ color: isLight ? '#000' : '#fff' }}>Google Drive</h3>
                                <p className="text-[9px] text-zinc-500 font-bold uppercase">
                                    {isTokenInvalid ? 'Sessão Expirada' : 'Backup em Nuvem'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={enableDrive}
                            disabled={isSaving}
                            className="w-12 h-6 rounded-full relative transition-all"
                            style={{ backgroundColor: driveEnabled ? currentTheme.primary : (isLight ? '#e4e4e7' : '#27272a') }}
                        >
                            <motion.div animate={{ x: driveEnabled ? 26 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                        </button>
                    </div>

                    <AnimatePresence>
                        {driveEnabled && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2 overflow-hidden"
                            >
                                {isTokenInvalid && (
                                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 mb-2">
                                        <AlertCircle size={16} className="text-amber-500 shrink-0" />
                                        <p className="text-[9px] font-bold text-amber-500 uppercase leading-tight">Sua sessão expirou. Reconecte para salvar.</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={handleManualBackup}
                                        disabled={isSaving}
                                        className="py-4 rounded-2xl flex items-center justify-center gap-2 border border-dashed transition-all active:scale-95"
                                        style={{
                                            borderColor: isTokenInvalid ? '#f59e0b' : currentTheme.primary,
                                            color: isTokenInvalid ? '#f59e0b' : currentTheme.primary,
                                            backgroundColor: isTokenInvalid ? '#f59e0b10' : `${currentTheme.primary}10`
                                        }}
                                    >
                                        <CloudUpload size={16} className={isSaving ? 'animate-bounce' : ''} />
                                        <span className="text-[10px] font-black uppercase">
                                            {isSaving ? 'Salvando...' : isTokenInvalid ? 'Reconectar' : 'Backup Agora'}
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => restoreFromDrive()}
                                        disabled={isSaving}
                                        className="py-4 rounded-2xl flex items-center justify-center gap-2 border border-dashed transition-all active:scale-95 text-zinc-500 border-zinc-500/30 bg-zinc-500/5"
                                    >
                                        <RefreshCw size={16} className={isSaving ? 'animate-spin' : ''} />
                                        <span className="text-[10px] font-black uppercase">Restaurar</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                        <button onClick={exportProfileJson} className="py-4 rounded-2xl font-black text-[9px] uppercase transition-all" style={{ backgroundColor: isLight ? '#f4f4f5' : '#27272a', color: isLight ? '#000' : '#fff' }}>Exportar JSON</button>
                        <button onClick={() => fileInputRef.current?.click()} className="py-4 rounded-2xl font-black text-[9px] uppercase transition-all" style={{ backgroundColor: isLight ? '#f4f4f5' : '#27272a', color: isLight ? '#000' : '#fff' }}>Importar JSON</button>
                    </div>
                </section>

                {/* CONTA & PERIGO */}
                <div className="pt-8 space-y-3 pb-20 text-center">
                    <AccountSection />
                    <button
                        onClick={profile.provider === 'google' ? disconnectGoogle : connectGoogle}
                        className="w-full py-5 rounded-3xl font-black uppercase text-xs transition-all border shadow-lg"
                        style={{
                            backgroundColor: profile.provider === 'google' ? 'transparent' : (isLight ? '#000' : '#fff'),
                            color: profile.provider === 'google' ? '#71717a' : (isLight ? '#fff' : '#000'),
                            borderColor: isLight ? '#e4e4e7' : '#27272a'
                        }}
                    >
                        {profile.provider === 'google' ? 'Desconectar Google' : 'Vincular Google'}
                    </button>

                    <button
                        onClick={deleteAccount}
                        className="w-full py-4 text-zinc-500 hover:text-red-500 transition-colors font-bold uppercase text-[9px] tracking-widest flex items-center justify-center gap-2"
                    >
                        <Trash2 size={12} /> Excluir Conta Permanentemente
                    </button>
                </div>
            </div>
        </motion.div>
    )
}