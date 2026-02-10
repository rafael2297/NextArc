/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openGoogleLogin: () => ipcRenderer.send('open-google-login'),
    onAuthCallback: (callback: (url: string) => void) => {
        const subscription = (_event: any, url: string) => callback(url);
        ipcRenderer.on('auth-callback', subscription);
        return () => {
            ipcRenderer.removeListener('auth-callback', subscription);
        };
    }
});