import {
    signOut,
    deleteUser,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithCredential,
} from 'firebase/auth'

import { ROUTES } from '../routes/paths'
import { auth, googleProvider } from './firebase'
import { useProfileStore } from '../store/useProfileStore'
import { useSessionStore } from '../store/useSessionStore'
import { restoreFromDrive, initDriveSync } from './driveSync'

// Detecta se estamos rodando dentro do Electron
const isElectron = window.navigator.userAgent.includes('Electron');

googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.setCustomParameters({ prompt: 'select_account' });

function mapFirebaseUser(user: any) {
    return {
        name: user.displayName ?? 'Usuário Google',
        avatar: user.photoURL ?? '',
        provider: 'google' as const,
    }
}

/* -------------------------
    LOGIN MANUAL (EXTERNO)
-------------------------- */
export async function signInWithGoogle(): Promise<void> {
    if (isElectron) {
        // No Electron, enviamos um sinal para o Main Process abrir o navegador
        // Usamos o window.ipcRenderer que você deve expor no preload.js ou habilitar nodeIntegration
        console.log("Iniciando fluxo de login externo via Electron...");
        (window as any).electronAPI?.openGoogleLogin();
        return;
    }

    // Fluxo normal para Web (Caso você ainda use a versão site)
    try {
        const { signInWithPopup } = await import('firebase/auth');
        const result = await signInWithPopup(auth, googleProvider);
        handleAuthSuccess(result);
    } catch (error) {
        console.error("Erro no Login Web:", error);
    }
}

// Função auxiliar para processar o sucesso (compartilhada)
export async function handleAuthSuccess(result: any) {
    const accessToken = result.accessToken || result.credential?.accessToken;
    if (!accessToken) return;

    try {
        // 1. BUSCA NOME E FOTO (Isso resolve o "não está pegando nada")
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const userData = await response.json();

        const profileStore = useProfileStore.getState();
        const sessionStore = useSessionStore.getState();

        // 2. SALVA NA STORE
        profileStore.setGoogleProfile({
            name: userData.name || 'Usuário Google',
            avatar: userData.picture || '',
            provider: 'google',
            accessToken: accessToken, // O driveSync.ts precisa disso aqui!
        } as any);

        sessionStore.enterAuthenticated();
        profileStore.toggleDrive(true);

        // 3. TENTA O DRIVE
        console.log("Perfil carregado! Buscando dados no Drive...");

        // Pequeno delay para garantir que a Store atualizou
        setTimeout(async () => {
            try {
                await restoreFromDrive(true); // 'true' força o carregamento
                initDriveSync();
            } catch (err) {
                console.error("Erro ao restaurar Drive:", err);
            }
        }, 1000);

        if (window.location.hash.includes(ROUTES.ACCESS)) {
            window.location.hash = "#/";
        }
    } catch (error) {
        console.error("Erro fatal no login:", error);
    }
}

/* -------------------------
    AUTO LOGIN E RESTANTE (IGUAL)
-------------------------- */
export function initAuthListener(): void {
    const sessionStore = useSessionStore.getState();
    const profileStore = useProfileStore.getState();

    // Se o Zustand diz que estamos autenticados e temos um token,
    // não deixamos o Firebase resetar nada.
    if (sessionStore.isAuthenticated && profileStore.profile.accessToken) {
        console.log("Sessão Zustand ativa. Pulando verificação do Firebase.");

        // Inicializa o que for necessário
        if (!profileStore.driveEnabled) profileStore.toggleDrive(true);

        // Tenta sincronizar
        restoreFromDrive(false).catch(() => { });
        initDriveSync();

        return; // Encerra aqui, não deixa o onAuthStateChanged rodar
    }

    // Opcional: manter o listener apenas para casos onde o Firebase é usado (Web)
    if (!isElectron) {
        onAuthStateChanged(auth, async (user) => {
            if (!user && sessionStore.isAuthenticated) {
                sessionStore.logout();
                profileStore.resetProfile();
            }
        });
    }
}

export async function signOutGoogle(): Promise<void> {
    try {
        await signOut(auth);
        useProfileStore.getState().resetProfile();
        useSessionStore.getState().logout();
    } catch (error) { console.error(error); }
}

export async function deleteGoogleAccount(): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;
    try {
        await deleteUser(user);
        useProfileStore.getState().resetProfile();
        useSessionStore.getState().logout();
    } catch (error) { console.error(error); throw error; }
}