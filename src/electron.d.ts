export interface IElectronAPI {
    openGoogleLogin: () => void;
    onAuthCallback: (callback: (url: string) => void) => () => void;
    windowControl: (action: 'minimize' | 'maximize' | 'close') => void;

    // --- FUNÇÕES PARA ATUALIZAÇÃO ---
    checkForUpdates: () => void;
    startDownload: () => void;
    quitAndInstall: () => void;

    // Listeners de Eventos (Retornam função de limpeza)
    onUpdateAvailable: (callback: (info: any) => void) => () => void;
    onUpdateNotAvailable: (callback: () => void) => () => void; // Adicionado
    onUpdateProgress: (callback: (percent: number) => void) => () => void;
    onUpdateReady: (callback: () => void) => () => void;
    onUpdateError: (callback: (error: string) => void) => () => void;
}

declare global {
    interface Window {
        // Ajustado para electronAPI para bater com seu padrão
        electronAPI: IElectronAPI;
    }
}