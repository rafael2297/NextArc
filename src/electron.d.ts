export interface IElectronAPI {
    openGoogleLogin: () => void;
    onAuthCallback: (callback: (url: string) => void) => () => void;
    windowControl: (action: 'minimize' | 'maximize' | 'close') => void;
}

declare global {
    interface Window {
        electronAPI: IElectronAPI;
    }
}