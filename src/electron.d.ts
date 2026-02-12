export interface IElectronAPI {
    openGoogleLogin: () => void;
    onAuthCallback: (callback: (url: string) => void) => () => void;
    windowControl: (action: 'minimize' | 'maximize' | 'close') => void;

    // --- NOVAS FUNÇÕES PARA ATUALIZAÇÃO ---
    checkForUpdates: () => void;
    startDownload: () => void;
    quitAndInstall: () => void;

    // Listeners de Eventos
    onUpdateAvailable: (callback: (version: string) => void) => void;
    onUpdateProgress: (callback: (percent: number) => void) => void;
    onUpdateReady: (callback: () => void) => void;
    onUpdateError: (callback: (error: string) => void) => void;
}

declare global {
    interface Window {
        electronAPI: IElectronAPI;
    }
}