/* eslint-disable @typescript-eslint/no-require-imports */
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    openGoogleLogin: () => ipcRenderer.send('open-google-login'),
    
    onAuthCallback: (callback: (url: string) => void) => {
        const subscription = (_event: IpcRendererEvent, url: string) => callback(url);
        ipcRenderer.on('auth-callback', subscription);
        return () => {
            ipcRenderer.removeListener('auth-callback', subscription);
        };
    },

    // --- NOVAS FUNÇÕES PARA ATUALIZAÇÃO ---
    checkForUpdates: () => ipcRenderer.send('check-for-updates'),
    
    downloadUpdate: () => ipcRenderer.send('start-download'),
    
    quitAndInstall: () => ipcRenderer.send('quit-and-install'),

    // Listeners com tipos definidos
    onUpdateAvailable: (callback: (info: any) => void) => {
        const subscription = (_event: IpcRendererEvent, info: any) => callback(info);
        ipcRenderer.on('update-available', subscription);
        return () => ipcRenderer.removeListener('update-available', subscription);
    },
    
    onUpdateProgress: (callback: (percent: number) => void) => {
        const subscription = (_event: IpcRendererEvent, percent: number) => callback(percent);
        ipcRenderer.on('update-progress', subscription);
        return () => ipcRenderer.removeListener('update-progress', subscription);
    },
    
    onUpdateReady: (callback: () => void) => {
        const subscription = (_event: IpcRendererEvent) => callback();
        ipcRenderer.on('update-ready', subscription);
        return () => ipcRenderer.removeListener('update-ready', subscription);
    },
    
    onUpdateError: (callback: (err: string) => void) => {
        const subscription = (_event: IpcRendererEvent, err: string) => callback(err);
        ipcRenderer.on('update-error', subscription);
        return () => ipcRenderer.removeListener('update-error', subscription);
    }
});