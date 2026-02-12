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

    // --- SISTEMA DE ATUALIZAÇÃO ---
    checkForUpdates: () => ipcRenderer.send('check-for-updates'),

    // Sincronizando o nome com o que seu useProfileController chama
    startDownload: () => ipcRenderer.send('start-download'),

    quitAndInstall: () => ipcRenderer.send('quit-and-install'),

    // --- LISTENERS (Sinais do Main para o React) ---

    // ESTE É O QUE FALTAVA PARA O TOAST DE "VERSÃO ATUALIZADA"
    onUpdateNotAvailable: (callback: () => void) => {
        const subscription = (_event: IpcRendererEvent) => callback();
        ipcRenderer.on('update-not-available', subscription);
        return () => ipcRenderer.removeListener('update-not-available', subscription);
    },

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