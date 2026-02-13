export interface IElectronAPI {
    // ADICIONE ESTA LINHA AQUI EMBAIXO
    getAppVersion: () => Promise<string>;

    openGoogleLogin: () => void;
    onAuthCallback: (callback: (url: string) => void) => () => void;
    windowControl: (action: 'minimize' | 'maximize' | 'close') => void;

    // --- FUNÇÕES PARA ATUALIZAÇÃO ---
    checkForUpdates: () => void;
    startDownload: () => void;
    quitAndInstall: () => void;

    // Listeners de Eventos (Retornam função de limpeza)
    onUpdateAvailable: (callback: (info: any) => void) => () => void;
    onUpdateNotAvailable: (callback: () => void) => () => void;
    onUpdateProgress: (callback: (percent: number) => void) => () => void;
    onUpdateReady: (callback: () => void) => () => void;
    onUpdateError: (callback: (error: string) => void) => () => void;
}

declare global {
    interface Window {
        electronAPI: IElectronAPI;
    }
}