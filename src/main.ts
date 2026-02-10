import { app, BrowserWindow, shell, ipcMain, session } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, ChildProcess, exec } from 'node:child_process';

const iconPath = path.join(__dirname, 'assets', 'icon.ico');

let mainWindow: BrowserWindow | null = null;
let apiProcess: ChildProcess | null = null;
let isQuitting = false; // Flag para controlar o estado de saída

const CUSTOM_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

app.setName('NesxtArc');
app.setAppUserModelId('com.nesxtarc.app');

/**
 * BACKEND MANAGEMENT
 */
function killBackendAndQuit() {
    if (apiProcess && apiProcess.pid) {
        console.log('Finalizando API antes de sair...');

        const killCommand = process.platform === 'win32'
            ? `taskkill /pid ${apiProcess.pid} /T /F`
            : `kill -9 ${apiProcess.pid}`;

        exec(killCommand, () => {
            console.log('API finalizada com sucesso.');
            apiProcess = null;
            app.quit(); // Encerra o app após a confirmação da morte do processo
        });
    } else {
        app.quit();
    }
}

function startBackend() {
    const apiDir = app.isPackaged
        ? path.join(process.resourcesPath, 'api')
        : path.resolve(app.getAppPath(), 'api');

    const apiPath = path.join(apiDir, 'index.js');

    apiProcess = spawn('node', [apiPath], {
        shell: true,
        cwd: apiDir,
        env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
    });

    apiProcess.on('error', (err) => console.error('[Backend Error]:', err));
}

/**
 * PROTOCOL REGISTRATION
 */
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('nesxtarc', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('nesxtarc');
}

/**
 * WINDOW MANAGEMENT
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
            partition: 'persist:nesxtarc-data',
        }
    });

    // Intercepta o clique no botão de fechar (X)
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault(); // Impede o fechamento imediato
            isQuitting = true;
            if (mainWindow) mainWindow.hide(); // Esconde para dar feedback de fechamento ao usuário
            killBackendAndQuit();
        }
    });

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
 * IPC EVENTS
 */
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
        `prompt=consent`;

    shell.openExternal(authUrl);
});

/**
 * LIFECYCLE & PROTOCOL HANDLING
 */
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
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

    app.whenReady().then(() => {
        session.defaultSession.setUserAgent(CUSTOM_USER_AGENT);
        startBackend();
        createWindow();

        const url = process.argv.find(arg => arg.startsWith('nesxtarc://'));
        if (url && mainWindow) {
            const currentWindow = mainWindow;
            currentWindow.webContents.on('did-finish-load', () => {
                currentWindow.webContents.send('auth-callback', url);
            });
        }
    });
}

app.on('open-url', (event, url) => {
    event.preventDefault();
    if (url.startsWith('nesxtarc://')) {
        if (mainWindow) {
            mainWindow.webContents.send('auth-callback', url);
        } else {
            createWindow();
            const checkWindow = setInterval(() => {
                if (mainWindow) {
                    const win = mainWindow;
                    win.webContents.once('did-finish-load', () => {
                        win.webContents.send('auth-callback', url);
                    });
                    clearInterval(checkWindow);
                }
            }, 100);
            setTimeout(() => clearInterval(checkWindow), 5000);
        }
    }
});

// Garante que o processo não feche antes da API ser morta
app.on('before-quit', (event) => {
    if (apiProcess && !isQuitting) {
        event.preventDefault();
        isQuitting = true;
        killBackendAndQuit();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // No Windows/Linux, o app.quit() é chamado dentro do killBackendAndQuit
    }
});