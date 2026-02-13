import { app, BrowserWindow, shell, ipcMain, session } from 'electron';
import path from 'node:path';
import { spawn, ChildProcess, exec } from 'node:child_process';
import { autoUpdater } from 'electron-updater';

const iconPath = path.join(__dirname, 'assets', 'icon.ico');

let mainWindow: BrowserWindow | null = null;
let apiProcess: ChildProcess | null = null;
let isQuitting = false;

const CUSTOM_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

app.setName('NextArc');
app.setAppUserModelId('com.nextarc.app');

/**
 * CONFIGURAÇÕES DO AUTO-UPDATER
 */
autoUpdater.autoDownload = false;
autoUpdater.allowPrerelease = false;

autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-available', info);
});

autoUpdater.on('download-progress', (progressObj) => {
    mainWindow?.webContents.send('update-progress', progressObj.percent);
});

autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update-ready');
});

autoUpdater.on('error', (err) => {
    console.error('Erro no updater:', err);
    mainWindow?.webContents.send('update-error', err.message);
});

autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update-not-available');
});

/**
 * GERENCIAMENTO DO BACKEND (API)
 */
// --- ALTERADO: Função de fechamento mais robusta ---
function killBackendAndQuit() {
    if (apiProcess && apiProcess.pid) {
        console.log(`Finalizando API (PID: ${apiProcess.pid})...`);

        if (process.platform === 'win32') {
            // Mata a árvore de processos de forma forçada (/F /T)
            exec(`taskkill /pid ${apiProcess.pid} /T /F`, (err) => {
                if (err) console.error('Erro ao matar processo:', err);
                apiProcess = null;
                process.exit(0); // Força a saída do Electron após matar a API
            });
        } else {
            apiProcess.kill('SIGKILL');
            apiProcess = null;
            app.quit();
        }
    } else {
        app.quit();
    }
}

function startBackend() {
    const apiDir = app.isPackaged
        ? path.join(process.resourcesPath, 'api')
        : path.resolve(app.getAppPath(), 'api');

    const apiPath = path.join(apiDir, 'index.js');

    apiProcess = spawn(process.execPath, [apiPath], {
        shell: false,
        cwd: apiDir,
        env: {
            ...process.env,
            ELECTRON_RUN_AS_NODE: '1'
        }
    });

    // --- CORREÇÃO NO MAIN.TS ---
    apiProcess.stdout?.on('data', (data) => {
        const msg = data.toString().trim();
        console.log(`[API]: ${msg}`);

        // Usamos JSON.stringify para transformar a mensagem em uma string segura para o JS
        const safeMsg = JSON.stringify(`[API LOG]: ${msg}`);
        mainWindow?.webContents.executeJavaScript(`console.log(${safeMsg})`).catch(() => { });
    });

    apiProcess.stderr?.on('data', (data) => {
        const msg = data.toString().trim();
        console.error(`[API Error]: ${msg}`);

        const safeMsg = JSON.stringify(`[API ERROR]: ${msg}`);
        mainWindow?.webContents.executeJavaScript(`console.error(${safeMsg})`).catch(() => { });
    });
}

/**
 * PROTOCOLO CUSTOMIZADO (Deep Linking)
 */
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('nextarc', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('nextarc');
}

/**
 * CRIAÇÃO DA JANELA PRINCIPAL
 */
function createWindow() {
    const preloadPath = path.join(__dirname, 'preload.cjs');

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        show: false,
        frame: true,
        icon: iconPath,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            preload: preloadPath,
            partition: 'persist:nextarc-data',
        }
    });

    // --- ALTERADO: Melhoria no fechamento ---
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            isQuitting = true;
            if (mainWindow) mainWindow.hide();
            killBackendAndQuit();
        }
    });

    // Atalho para DevTools
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.shift && input.key.toLowerCase() === 'i') {
            mainWindow?.webContents.openDevTools();
        }
    });

    mainWindow.setMenu(null);

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https://accounts.google.com')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    if (!app.isPackaged) {
        const VITE_URL = 'http://localhost:5173';
        mainWindow.loadURL(VITE_URL).catch(() => {
            setTimeout(() => mainWindow?.loadURL(VITE_URL), 2000);
        });
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

/**
 * EVENTOS IPC
 */
ipcMain.on('open-google-login', () => {
    const clientId = "637162798817-kounta0g5pn28c67ht16qsod9eihgh9p.apps.googleusercontent.com";
    const redirectUri = "https://site-anime-e5395.web.app/success.html";
    const scopes = ["openid", "email", "profile", "https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive.appdata"].join(" ");

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scopes)}&prompt=consent`;

    shell.openExternal(authUrl);
});

ipcMain.on('check-for-updates', () => {
    autoUpdater.checkForUpdates();
});

ipcMain.on('start-download', () => {
    autoUpdater.downloadUpdate();
});

ipcMain.on('quit-and-install', () => {
    autoUpdater.quitAndInstall();
});

ipcMain.handle('get-app-version', () => {
    return app.getVersion(); 
});

/**
 * CICLO DE VIDA
 */
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (_event, commandLine) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            const url = commandLine.find(arg => arg.startsWith('nextarc://'));
            if (url) {
                mainWindow.webContents.send('auth-callback', url);
            }
        }
    });

    app.whenReady().then(() => {
        session.defaultSession.setUserAgent(CUSTOM_USER_AGENT);
        startBackend();
        createWindow();

        if (app.isPackaged) {
            setTimeout(() => {
                autoUpdater.checkForUpdatesAndNotify();
            }, 5000);
        }
    });
}

app.on('open-url', (event, url) => {
    event.preventDefault();
    if (url.startsWith('nextarc://')) {
        if (mainWindow) {
            mainWindow.webContents.send('auth-callback', url);
        } else {
            createWindow();
        }
    }
});

// --- ALTERADO: Garantia total de limpeza ---
app.on('before-quit', (event) => {
    if (apiProcess && !isQuitting) {
        event.preventDefault();
        isQuitting = true;
        killBackendAndQuit();
    }
});