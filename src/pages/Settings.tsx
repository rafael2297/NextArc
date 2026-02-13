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
    ChevronDown,
    Check,
    Image as ImageIcon,
    X,
    CloudUpload,
    RefreshCw,
    AlertCircle,
    Rocket,
    Sparkles,
    DownloadCloud
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { AccountSection } from '../components/profile/AccountSection'
import { useProfileController } from '../hooks/useSettingsController'
import { useSessionStore } from '../store/useSessionStore'
import { ROUTES } from '../routes/paths'
import { hexToRgba } from '../utils/colors'

export default function Settings() {
    const navigate = useNavigate()
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
        updateBannerImage,
        // Novos estados vindos do controller atualizado
        isCheckingUpdate,
        updateStatus,
        downloadProgress,
        checkForUpdates,
        startUpdateDownload,
        installUpdate
    } = useProfileController()


    const [version, setVersion] = useState("...");
    useEffect(() => {
        const fetchVersion = async () => {
            if (window.electronAPI?.getAppVersion) {
                const v = await window.electronAPI.getAppVersion();
                setVersion(v);
            }
        };
        fetchVersion();
    }, []);

    const handleManualCheck = () => {
        // Se já sabemos que tem update, apenas baixa
        if (updateStatus === 'available') {
            window.electronAPI.startDownload();
        } else {
            // Se não sabemos, verifica. 
            // No main.ts, o autoUpdater.checkForUpdatesAndNotify() disparará o evento 'update-available'
            window.electronAPI.checkForUpdates();
        }
    };


    const { nsfwMode, setNSFWMode } = useSessionStore()

    const isTokenInvalid = !profile.accessToken || profile.accessToken.includes('nesxtarc://');

    const currentTheme = {
        primary: profile?.theme?.primary || '#3b82f6',
        background: profile?.theme?.background || '#000000',
        navbar: profile?.theme?.navbar || '#111111'
    };

    const isLight = currentTheme.background.toLowerCase() === '#ffffff' || currentTheme.background.toLowerCase() === 'white';

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

            {/* VOLTAR */}
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

            {/* HEADER */}
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
                    <h1 className="mt-4 text-2xl font-black italic uppercase tracking-tighter">
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
                            <p className="text-xl font-black">{stat.value}</p>
                            <p className="text-[7px] uppercase tracking-widest text-zinc-500 font-bold">{stat.label}</p>
                        </div>
                    ))}
                </section>

                {/* PERSONALIZAÇÃO */}
                <section className="backdrop-blur-xl border p-6 rounded-[2rem] shadow-2xl relative"
                    style={{
                        backgroundColor: isLight ? '#ffffff' : 'rgba(24, 24, 27, 0.4)',
                        borderColor: isLight ? '#e4e4e7' : 'rgba(63, 63, 70, 0.5)',
                        zIndex: isSelectOpen ? 50 : 1
                    }}>
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <Palette size={18} style={{ color: currentTheme.primary }} />
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Estilo do App</h3>
                    </div>

                    <div className="space-y-3 mb-8">
                        <div className="flex gap-2">
                            <button onClick={() => bannerInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all active:scale-95"
                                style={{ backgroundColor: isLight ? '#f4f4f5' : '#09090b', borderColor: isLight ? '#e4e4e7' : '#27272a' }}>
                                <ImageIcon size={18} style={{ color: currentTheme.primary }} />
                                <span className="text-xs font-bold uppercase">Banner</span>
                            </button>
                            {profile.banner && (
                                <button onClick={() => updateBannerImage(null)} className="w-14 flex items-center justify-center rounded-2xl border border-red-500/20 text-red-500"
                                    style={{ backgroundColor: isLight ? '#f4f4f5' : '#09090b' }}>
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* PRESETS */}
                    <div className="relative mb-8">
                        <button onClick={() => setIsSelectOpen(!isSelectOpen)} className="w-full flex items-center justify-between p-4 rounded-2xl border transition-all"
                            style={{ backgroundColor: isLight ? '#f4f4f5' : '#09090b', borderColor: isSelectOpen ? currentTheme.primary : (isLight ? '#e4e4e7' : '#27272a') }}>
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: currentTheme.primary }} />
                                <span className="text-sm font-bold uppercase">Presets</span>
                            </div>
                            <ChevronDown size={20} className={`transition-transform ${isSelectOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {isSelectOpen && (
                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 5 }} exit={{ opacity: 0 }} className="absolute w-full z-50 p-2 rounded-3xl border shadow-2xl backdrop-blur-2xl"
                                    style={{ backgroundColor: isLight ? '#fff' : '#0f0f0f', borderColor: isLight ? '#e4e4e7' : '#27272a' }}>
                                    {themePresets.map((t) => (
                                        <button key={t.name} onClick={() => { updateFullTheme(t.colors); setIsSelectOpen(false); }} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.colors.primary }} />
                                                <span className="text-xs font-bold uppercase">{t.name}</span>
                                            </div>
                                            {currentTheme.background === t.colors.background && <Check size={16} style={{ color: t.colors.primary }} />}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* AJUSTE MANUAL */}
                    <div className="border-t pt-4" style={{ borderColor: isLight ? '#f4f4f5' : 'rgba(255,255,255,0.05)' }}>
                        <button onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} className="w-full flex items-center justify-between px-2">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ajuste Manual</span>
                            <ChevronDown size={16} className={`transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isAdvancedOpen && (
                            <div className="grid grid-cols-3 gap-2 mt-4">
                                {(['background', 'navbar', 'primary'] as const).map((key) => (
                                    <div key={key} className="relative h-10 rounded-xl border flex items-center justify-center overflow-hidden" style={{ backgroundColor: currentTheme[key], borderColor: 'rgba(255,255,255,0.1)' }}>
                                        <input type="color" value={currentTheme[key]} onChange={(e) => updateSpecificColor(key, e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        <span className="text-[8px] font-black uppercase mix-blend-difference text-white">{key}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* SOFTWARE UPDATE */}
                <section className="backdrop-blur-xl border p-6 rounded-[2rem] relative group"
                    style={{
                        backgroundColor: isLight ? '#ffffff' : 'rgba(24, 24, 27, 0.4)',
                        borderColor: isLight ? '#e4e4e7' : 'rgba(63, 63, 70, 0.5)'
                    }}>
                    <div className="flex items-center justify-between mb-6 px-2">
                        <div className="flex items-center gap-3">
                            <Rocket size={18} className="text-purple-500" />
                            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Software</h3>
                        </div>
                        <span className="text-[9px] font-bold px-3 py-1 rounded-full bg-zinc-500/10 text-zinc-500">
                            v{version}
                        </span>
                    </div>

                    {/* Botão de Update Otimizado */}
                    <button
                        onClick={() => {
                            if (updateStatus === 'ready') installUpdate();
                            else if (updateStatus === 'available') startUpdateDownload(); // Inicia o download manual
                            else checkForUpdates();
                        }}
                        disabled={isCheckingUpdate || updateStatus === 'downloading'}
                        className="w-full relative overflow-hidden active:scale-[0.98] transition-all"
                    >
                        <div className="relative z-10 py-4 rounded-2xl flex items-center justify-center gap-3 border transition-all"
                            style={{
                                // MUDANÇA: Se estiver pronto, o fundo fica verde
                                backgroundColor: updateStatus === 'ready' ? 'rgba(34, 197, 94, 0.1)' : (isLight ? '#f4f4f5' : '#09090b'),
                                borderColor: updateStatus === 'ready' ? '#22c55e' : (isCheckingUpdate ? currentTheme.primary : (isLight ? '#e4e4e7' : '#27272a')),
                                color: updateStatus === 'ready' ? '#22c55e' : 'inherit'
                            }}>

                            {isCheckingUpdate || updateStatus === 'downloading' ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                                    <RefreshCw size={18} style={{ color: currentTheme.primary }} />
                                </motion.div>
                            ) : updateStatus === 'ready' ? (
                                <CheckCircle2 size={18} className="text-green-500 animate-bounce" />
                            ) : updateStatus === 'available' ? (
                                <DownloadCloud size={18} className="animate-pulse" style={{ color: currentTheme.primary }} />
                            ) : (
                                <DownloadCloud size={18} style={{ color: currentTheme.primary }} />
                            )}

                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {isCheckingUpdate ? 'Verificando...' :
                                    updateStatus === 'available' ? 'Baixar Atualização' :
                                        updateStatus === 'downloading' ? `Baixando ${downloadProgress}%` :
                                            updateStatus === 'ready' ? 'Instalar e Reiniciar Agora' :
                                                updateStatus === 'latest' ? 'Você está na versão mais recente' : 'Verificar Atualizações'}
                            </span>
                        </div>

                        {/* Barra de progresso visível no fundo do botão */}
                        {updateStatus === 'downloading' && (
                            <motion.div
                                className="absolute bottom-0 left-0 h-1 bg-blue-500 z-20"
                                initial={{ width: 0 }}
                                animate={{ width: `${downloadProgress}%` }}
                            />
                        )}
                    </button>

                    {/* Mensagem de sucesso extra se estiver pronto */}
                    {updateStatus === 'ready' && (
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center text-[9px] font-bold text-green-500 uppercase mt-3 tracking-tighter"
                        >
                            Download concluído com sucesso!
                        </motion.p>
                    )}
                </section>

                {/* PRIVACIDADE */}
                <section className="backdrop-blur-xl border p-6 rounded-[2rem]"
                    style={{ backgroundColor: isLight ? '#ffffff' : 'rgba(24, 24, 27, 0.4)', borderColor: isLight ? '#e4e4e7' : 'rgba(63, 63, 70, 0.5)' }}>
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <EyeOff size={18} className="text-rose-500" />
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Conteúdo Sensível</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {['hide', 'blur', 'show'].map((mode) => (
                            <button key={mode} onClick={() => setNSFWMode(mode as any)} className="p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all uppercase text-[8px] font-black"
                                style={{
                                    backgroundColor: nsfwMode === mode ? hexToRgba(currentTheme.primary, 0.1) : 'transparent',
                                    borderColor: nsfwMode === mode ? currentTheme.primary : 'rgba(255,255,255,0.05)',
                                    color: nsfwMode === mode ? currentTheme.primary : '#71717a'
                                }}>
                                {mode === 'hide' ? <EyeOff size={20} /> : mode === 'blur' ? <Droplets size={20} /> : <Eye size={20} />}
                                {mode}
                            </button>
                        ))}
                    </div>
                </section>

                {/* SINCRONIZAÇÃO */}
                <section className="backdrop-blur-xl border rounded-[2rem] p-6 space-y-4"
                    style={{ backgroundColor: isLight ? '#ffffff' : 'rgba(24, 24, 27, 0.4)', borderColor: isLight ? '#e4e4e7' : 'rgba(63, 63, 70, 0.5)' }}>
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <Database size={20} style={{ color: isTokenInvalid ? '#f59e0b' : currentTheme.primary }} />
                            <div>
                                <h3 className="text-xs font-black uppercase">Google Drive</h3>
                                <p className="text-[9px] text-zinc-500 font-bold uppercase">{isTokenInvalid ? 'Sessão Expirada' : 'Nuvem'}</p>
                            </div>
                        </div>
                        <button onClick={enableDrive} className="w-12 h-6 rounded-full relative transition-all"
                            style={{ backgroundColor: driveEnabled ? currentTheme.primary : '#27272a' }}>
                            <motion.div animate={{ x: driveEnabled ? 26 : 4 }} className="absolute top-1 w-4 h-4 bg-white rounded-full" />
                        </button>
                    </div>

                    {driveEnabled && (
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={exportToDrive}
                                disabled={isSaving}
                                className="h-14 rounded-2xl border border-dashed flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all active:scale-95 disabled:opacity-50"
                                style={{ borderColor: currentTheme.primary, color: currentTheme.primary }}
                            >
                                <CloudUpload size={16} className={isSaving ? 'animate-bounce' : ''} />
                                <span>{isSaving ? 'Salvando...' : 'Backup'}</span>
                            </button>

                            <button
                                onClick={restoreFromDrive}
                                disabled={isSaving}
                                className="h-14 rounded-2xl border border-dashed border-zinc-500/30 text-zinc-500 text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                style={{ backgroundColor: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)' }}
                            >
                                <RefreshCw size={16} className={isSaving ? 'animate-spin' : ''} />
                                <span>Restaurar</span>
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                        <button onClick={exportProfileJson} className="py-4 rounded-2xl font-black text-[9px] uppercase bg-zinc-500/10">Exportar JSON</button>
                        <button onClick={() => fileInputRef.current?.click()} className="py-4 rounded-2xl font-black text-[9px] uppercase bg-zinc-500/10">Importar JSON</button>
                    </div>
                </section>

                {/* CONTA & PERIGO */}
                <div className="pt-8 space-y-3 pb-20 text-center">
                    <AccountSection />
                    <button onClick={profile.provider === 'google' ? disconnectGoogle : connectGoogle} className="w-full py-5 rounded-3xl font-black uppercase text-xs transition-all border"
                        style={{ backgroundColor: profile.provider === 'google' ? 'transparent' : '#fff', color: profile.provider === 'google' ? '#71717a' : '#000' }}>
                        {profile.provider === 'google' ? 'Desconectar Google' : 'Vincular Google'}
                    </button>
                    <button onClick={deleteAccount} className="w-full py-4 text-zinc-500 hover:text-red-500 transition-colors font-bold uppercase text-[9px] flex items-center justify-center gap-2">
                        <Trash2 size={12} /> Excluir Conta Permanentemente
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

