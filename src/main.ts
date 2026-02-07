import { app, BrowserWindow, shell, ipcMain, session } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iconPath = path.join(__dirname, 'assets', 'icon.ico');
let mainWindow: BrowserWindow | null = null;

/**
 * 🛠 CONFIGURAÇÕES DE IDENTIDADE
 * Definir o nome e o ID do app garante que o Windows crie uma pasta fixa
 * para o LocalStorage em %APPDATA%/NesxtArc
 */
app.setName('NesxtArc');
app.setAppUserModelId('com.nesxtarc.app');

// 1. REGISTRO DO PROTOCOLO (Mantido para o Login do Google)
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('nesxtarc', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('nesxtarc');
}

function createWindow() {
    const preloadPath = path.join(__dirname, 'preload.js');

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        frame: true,
        icon: iconPath,
        transparent: false,
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: preloadPath,
            // FORÇA O ARMAZENAMENTO EM UMA PASTA FIXA
            partition: 'persist:nesxtarc-data',
            // Desativa caches temporários que podem causar "amnésia" no app
            session: session.fromPartition('persist:nesxtarc-data')
        }
    });

    /**
     * 🔍 MODO DEBUG:
     * Abre o console automaticamente. Verifique a aba 'Application' -> 'Local Storage'
     * para ver se os dados do Zustand estão lá após o login.
     */
    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }

    // Remove o menu superior nativo
    mainWindow.setMenu(null);

    if (!app.isPackaged) {
        const VITE_URL = 'http://localhost:5173';
        const loadVite = () => {
            mainWindow?.loadURL(VITE_URL).catch(() => {
                setTimeout(loadVite, 1000);
            });
        };
        loadVite();
    } else {
        const indexPath = path.join(__dirname, '../dist/index.html');
        mainWindow.loadFile(indexPath);
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// --- LÓGICA DE LOGIN (Google OAuth) ---
ipcMain.on('open-google-login', () => {
    const clientId = "637162798817-kounta0g5pn28c67ht16qsod9eihgh9p.apps.googleusercontent.com";
    const redirectUri = "https://site-anime-e5395.web.app/success.html";

    const scopes = [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive.appdata"
    ].join(" ");

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=token&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `prompt=select_account`;

    shell.openExternal(authUrl);
});

// --- TRATAMENTO DE INSTÂNCIA ÚNICA E CALLBACK ---
app.on('second-instance', (_event, commandLine) => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();

        const url = commandLine.find(arg => arg.startsWith('nesxtarc://'));
        if (url) {
            mainWindow.webContents.send('auth-callback', url);
        }
    }
});

app.on('open-url', (event, url) => {
    event.preventDefault();
    if (url.startsWith('nesxtarc://')) {
        mainWindow?.webContents.send('auth-callback', url);
    }
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.whenReady().then(() => {
        createWindow();

        const url = process.argv.find(arg => arg.startsWith('nesxtarc://'));
        if (url) {
            mainWindow?.webContents.on('did-finish-load', () => {
                mainWindow?.webContents.send('auth-callback', url);
            });
        }
    });
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});