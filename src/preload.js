const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    openGoogleLogin: () => ipcRenderer.send('open-google-login'),
    onAuthCallback: (callback) => ipcRenderer.on('auth-callback', (_event, value) => callback(value))
});