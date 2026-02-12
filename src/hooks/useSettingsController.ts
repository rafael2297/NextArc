import { useEffect, useRef, useCallback, useState } from 'react'
import { useProfileStore, type UserTheme } from '../store/useProfileStore'
import { useAppStore, type CardItem } from '../store/useAppStore'
import { useToast } from '../components/toast/useToast'

import {
    saveFileToDrive,
    loadFileFromDrive,
    deleteFileFromDrive,
} from '../services/googleDrive'

import {
    signInWithGoogle,
    signOutGoogle,
    deleteGoogleAccount,
} from '../services/googleAuth'

import type {
    AnimeStatus,
    ReadingStatus,
} from '../store/useAppStore'

interface BackupData {
    version: number;
    updatedAt: number;
    animes: any[];
    mangas: any[];
    rpg: {
        coins: number;
        xp: number;
        inventory: CardItem[];
    };
    theme?: {
        colors: UserTheme;
        banner?: string | null;
    };
}

const BACKUP_FILE = 'otaku-library.json'
const AUTO_SAVE_INTERVAL = 1000 * 60 * 5 // 5 min

function isAnimeStatus(status: any): status is AnimeStatus {
    return ['watching', 'completed', 'paused', 'dropped', 'planned'].includes(status)
}

function isReadingStatus(status: any): status is ReadingStatus {
    return ['reading', 'completed', 'paused', 'dropped', 'planned'].includes(status)
}

export function useProfileController() {
    const profile = useProfileStore((state) => state.profile);
    const setProfile = useProfileStore((state) => state.setProfile);
    const updateProfile = useProfileStore((state) => state.updateProfile);
    const driveEnabled = useProfileStore((state) => state.driveEnabled);
    const resetProfile = useProfileStore((state) => state.resetProfile);
    const toggleDrive = useProfileStore((state) => state.toggleDrive);

    // --- ESTADOS DE UPDATE (CONECTADOS AO MAIN.TS) ---
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'latest' | 'downloading' | 'ready'>('idle');
    const [downloadProgress, setDownloadProgress] = useState(0);

    const isToastActive = useRef(false);
    const { showToast } = useToast();

    const {
        animeList,
        mangaList,
        coins,
        xp,
        inventory,
        addAnime,
        addManga,
        resetStore,
    } = useAppStore()

    const [isSaving, setIsSaving] = useState(false)
    const intervalRef = useRef<number | null>(null)

    const checkForUpdates = useCallback(() => {
        if (isCheckingUpdate) return;
        setIsCheckingUpdate(true);
        setUpdateStatus('checking'); // Opcional: um estado visual intermediário

        window.electronAPI?.checkForUpdates();

        // Timeout de segurança caso o Electron não responda
        setTimeout(() => setIsCheckingUpdate(false), 15000);
    }, [isCheckingUpdate]);

    const startUpdateDownload = () => {
        setUpdateStatus('downloading');
        window.electronAPI?.startDownload();
    };

    const installUpdate = () => {
        window.electronAPI?.quitAndInstall();
    };

    // --- TEMAS ---
    const applyTheme = useCallback((theme: UserTheme) => {
        if (!theme) return;
        const root = document.documentElement;
        root.style.setProperty('--color-bg', theme.background);
        root.style.setProperty('--color-nav', theme.navbar);
        root.style.setProperty('--color-primary', theme.primary);
        root.style.setProperty('--color-primary-glow', `${theme.primary}59`);

        const isWhite = theme.background.toLowerCase() === '#ffffff' || theme.background.toLowerCase() === 'white';
        if (isWhite) {
            root.style.colorScheme = 'light';
            root.style.color = '#121212';
        } else {
            root.style.colorScheme = 'dark';
            root.style.color = 'rgba(255, 255, 255, 0.87)';
        }
    }, []);

    const updateFullTheme = (newTheme: UserTheme) => {
        updateProfile({ theme: newTheme });
        applyTheme(newTheme);
    };

    const updateSpecificColor = (key: keyof UserTheme, color: string) => {
        const newTheme = { ...profile.theme, [key]: color };
        updateProfile({ theme: newTheme });
        applyTheme(newTheme);
    };

    const updateBannerImage = async (file: File | null) => {
        if (!file) {
            updateProfile({ banner: undefined });
            showToast("Banner removido!", "info");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            updateProfile({ banner: reader.result as string });
            showToast("Banner atualizado!", "success");
        };
        reader.readAsDataURL(file);
    }

    // --- DADOS ---
    const getLatestLocalTimestamp = useCallback(() => {
        const dates = [...animeList.map(a => a.updatedAt || 0), ...mangaList.map(m => m.updatedAt || 0), 0];
        return Math.max(...dates);
    }, [animeList, mangaList]);

    const buildUserData = useCallback((): BackupData => ({
        version: 4,
        updatedAt: getLatestLocalTimestamp() || Date.now(),
        animes: animeList,
        mangas: mangaList,
        rpg: { coins, xp, inventory },
        theme: { colors: profile.theme, banner: profile.banner }
    }), [animeList, mangaList, coins, xp, inventory, getLatestLocalTimestamp, profile.theme, profile.banner]);

    const handleTokenExpiration = useCallback((actionType: 'backup' | 'restore') => {
        if (isToastActive.current) return;
        const message = actionType === 'backup'
            ? "Sua conexão expirou. Reconecte para salvar seu progresso no Drive."
            : "Sua conexão expirou. Reconecte para baixar seus dados do Drive.";
        isToastActive.current = true;
        showToast(message, "error", 0, "Reconectar Agora", () => {
            isToastActive.current = false;
            signInWithGoogle();
        }
        );
    }, [showToast]);

    // --- GOOGLE DRIVE ---
    const backupNow = useCallback(async (manualToken?: string): Promise<void> => {
        const token = manualToken || profile.accessToken;
        if (!token || !driveEnabled) return;
        try {
            setIsSaving(true);
            await saveFileToDrive(BACKUP_FILE, buildUserData(), token);
            if (manualToken) showToast("Backup realizado no Drive!", "success");
        } catch (error: any) {
            const isUnauthorized = error.status === 401 || error.message?.includes('401') || error.message === 'TOKEN_EXPIRED';
            if (isUnauthorized) handleTokenExpiration('backup');
            else showToast("Erro ao acessar o Drive.", "error");
        } finally { setIsSaving(false); }
    }, [driveEnabled, profile.accessToken, buildUserData, showToast, handleTokenExpiration]);

    const restoreFromDrive = useCallback(async (manualToken?: string): Promise<void> => {
        const token = manualToken || profile.accessToken;
        if (!token) { showToast("Conecte ao Google primeiro.", "info"); return; }
        try {
            setIsSaving(true);
            const rawData = await loadFileFromDrive(BACKUP_FILE, token);
            if (!rawData) { showToast("Nenhum backup encontrado no Drive.", "info"); return; }
            const data = rawData as unknown as BackupData;
            resetStore();
            data.animes?.forEach(a => addAnime({ ...a, status: isAnimeStatus(a.status) ? a.status : 'planned' }));
            data.mangas?.forEach(m => addManga({ ...m, status: isReadingStatus(m.status) ? m.status : 'planned' }));
            if (data.rpg) {
                useAppStore.setState({ coins: data.rpg.coins || 0, xp: data.rpg.xp || 0, inventory: data.rpg.inventory || [] });
            }
            if (data.theme) {
                setProfile({ ...profile, theme: data.theme.colors || profile.theme, banner: data.theme.banner || undefined });
            }
            showToast("Dados restaurados com sucesso!", "success");
        } catch (error: any) {
            if (error.message === 'TOKEN_EXPIRED') handleTokenExpiration('restore');
            else showToast("Erro ao restaurar dados.", "error");
        } finally { setIsSaving(false); }
    }, [profile, resetStore, addAnime, addManga, setProfile, showToast, handleTokenExpiration]);

    const exportAppDataJson = () => {
        try {
            const blob = new Blob([JSON.stringify(buildUserData(), null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `otaku-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast("JSON exportado!", "success");
        } catch { showToast("Erro ao exportar JSON.", "error"); }
    }

    const importProfile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result as string) as BackupData;
                resetStore();
                data.animes?.forEach(a => addAnime({ ...a, status: isAnimeStatus(a.status) ? a.status : 'planned' }));
                data.mangas?.forEach(m => addManga({ ...m, status: isReadingStatus(m.status) ? m.status : 'planned' }));
                if (data.theme) {
                    setProfile({ ...profile, theme: data.theme.colors || profile.theme, banner: data.theme.banner || undefined });
                }
                showToast("Dados importados!", "success");
            } catch { showToast("Arquivo inválido.", "error"); }
        };
        reader.readAsText(file);
    };

    // --- EFEITO: ESCUTAR O ELECTRON (UPDATER) ---
    useEffect(() => {
        if (!window.electronAPI) return;

        const removeAvailable = window.electronAPI.onUpdateAvailable((info: any) => {
            setIsCheckingUpdate(false);
            setUpdateStatus('available');
            showToast(`Nova versão ${info?.version || ''} disponível!`, "info");
        });

        const removeNotAvailable = window.electronAPI.onUpdateNotAvailable(() => {
            setIsCheckingUpdate(false);
            setUpdateStatus('latest');
            showToast("Você já está na versão mais atualizada!", "success");
        });

        const removeProgress = window.electronAPI.onUpdateProgress((percent: number) => {
            setUpdateStatus('downloading');
            setDownloadProgress(Math.round(percent));
        });

        const removeReady = window.electronAPI.onUpdateReady(() => {
            setUpdateStatus('ready');
            showToast("Download concluído! Reinicie para aplicar.", "success");
        });

        const removeError = window.electronAPI.onUpdateError((err: string) => {
            setIsCheckingUpdate(false);

            // TRATAMENTO ESPECIAL PARA O ERRO 406 / FEED DO GITHUB
            // Se ele falhar ao ler o feed, mas você já está na versão da tag (1.0.1),
            // consideramos que o usuário está atualizado.
            if (err.includes("406") || err.includes("Unable to find latest version")) {
                setUpdateStatus('latest');
                showToast("Você está na versão mais recente!", "success");
            } else {
                setUpdateStatus('idle');
                showToast("Falha ao buscar atualização.", "error");
            }

            console.error("Update Error:", err);
        });

        return () => {
            removeAvailable?.();
            removeNotAvailable?.();
            removeProgress?.();
            removeReady?.();
            removeError?.();
        };
    }, [showToast]);

    // --- EFEITOS DE TEMA E BACKUP ---
    useEffect(() => { applyTheme(profile.theme); }, [profile.theme, applyTheme]);

    useEffect(() => {
        if (driveEnabled && profile.accessToken) {
            const timer = setTimeout(() => backupNow(), 3000);
            return () => clearTimeout(timer);
        }
    }, [animeList, mangaList, coins, xp, inventory, driveEnabled, profile.accessToken, backupNow]);

    useEffect(() => {
        if (!driveEnabled || !profile.accessToken) return;
        intervalRef.current = window.setInterval(() => backupNow().catch(() => { }), AUTO_SAVE_INTERVAL);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [driveEnabled, profile.accessToken, backupNow])

    useEffect(() => { return () => { isToastActive.current = false; } }, []);

    return {
        profile,
        driveEnabled,
        isSaving,
        // Update System
        isCheckingUpdate,
        updateStatus,
        downloadProgress,
        checkForUpdates,
        startUpdateDownload,
        installUpdate,
        // Google/Account
        connectGoogle: signInWithGoogle,
        disconnectGoogle: async () => { await signOutGoogle(); resetProfile(); },
        enableDrive: async () => {
            if (profile.provider !== 'google') await signInWithGoogle();
            else toggleDrive(!driveEnabled);
        },
        exportToDrive: () => {
            if (!profile.accessToken) { handleTokenExpiration('backup'); return; }
            backupNow(profile.accessToken);
        },
        restoreFromDrive: () => restoreFromDrive(profile.accessToken),
        exportProfileJson: exportAppDataJson,
        importProfile,
        updateFullTheme,
        updateSpecificColor,
        updateBannerImage,
        deleteAccount: async () => {
            if (window.confirm("PERIGO: Apagar tudo permanentemente?")) {
                try {
                    if (profile.accessToken) await deleteFileFromDrive(BACKUP_FILE, profile.accessToken);
                    if (profile.provider === 'google') await deleteGoogleAccount();
                    resetProfile(); resetStore(); localStorage.clear();
                    showToast("Tudo foi apagado!", "success");
                    setTimeout(() => window.location.reload(), 1000);
                } catch { showToast("Erro ao limpar dados.", "error"); }
            }
        },
        animeList,
        mangaList,
    }
}