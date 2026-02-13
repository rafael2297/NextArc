/* eslint-disable @typescript-eslint/no-require-imports */
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),

    openGoogleLogin: () => ipcRenderer.send('open-google-login'),


    onAuthCallback: (callback: (url: string) => void) => {
        const subscription = (_event: IpcRendererEvent, url: string) => callback(url);
        ipcRenderer.on('auth-callback', subscription);
        return () => ipcRenderer.removeListener('auth-callback', subscription);
    },

    // --- SISTEMA DE ATUALIZAÇÃO ---
    checkForUpdates: () => ipcRenderer.send('check-for-updates'),
    startDownload: () => ipcRenderer.send('start-download'),
    quitAndInstall: () => ipcRenderer.send('quit-and-install'),

    // --- LISTENERS INDIVIDUAIS ---
    onUpdateNotAvailable: (callback: () => void) => {
        const sub = () => callback();
        ipcRenderer.on('update-not-available', sub);
        return () => ipcRenderer.removeListener('update-not-available', sub);
    },

    onUpdateAvailable: (callback: (info: any) => void) => {
        const sub = (_e: any, info: any) => callback(info);
        ipcRenderer.on('update-available', sub);
        return () => ipcRenderer.removeListener('update-available', sub);
    },


    onUpdateProgress: (callback: (percent: number) => void) => {
        const sub = (_e: any, percent: number) => callback(percent);
        ipcRenderer.on('update-progress', sub);
        return () => ipcRenderer.removeListener('update-progress', sub);
    },

    onUpdateReady: (callback: () => void) => {
        const sub = () => callback();
        ipcRenderer.on('update-ready', sub);
        return () => ipcRenderer.removeListener('update-ready', sub);
    },

    onUpdateError: (callback: (err: string) => void) => {
        const sub = (_e: any, err: any) => callback(err);
        ipcRenderer.on('update-error', sub);
        return () => ipcRenderer.removeListener('update-error', sub);
    }
});