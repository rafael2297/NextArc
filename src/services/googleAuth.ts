import {
    signOut,
    deleteUser,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithCredential,
} from 'firebase/auth'

import { auth, googleProvider } from './firebase'
import { useProfileStore } from '../store/useProfileStore'
import { useSessionStore } from '../store/useSessionStore'
import { initDriveSync } from './driveSync' // Removido restoreFromDrive daqui

const isElectron = typeof window !== 'undefined' && window.navigator.userAgent.includes('Electron');

googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/drive.appdata');
googleProvider.setCustomParameters({ prompt: 'select_account' });

/* -------------------------
    LOGIN MANUAL (DISPARO)
-------------------------- */
export async function signInWithGoogle(): Promise<void> {
    if (isElectron) {
        (window as any).electronAPI?.openGoogleLogin();
        return;
    }

    try {
        const { signInWithPopup } = await import('firebase/auth');
        const result = await signInWithPopup(auth, googleProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);

        if (credential?.accessToken) {
            await handleAuthSuccess({
                accessToken: credential.accessToken,
                user: result.user
            });
        }
    } catch (error) {
        console.error("[GoogleAuth]: Erro no Login Web:", error);
    }
}

/* -------------------------
    PROCESSAMENTO DO SUCESSO
-------------------------- */
export async function handleAuthSuccess(result: { accessToken: string, user?: any }) {
    const { accessToken } = result;

    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error("Falha ao buscar userinfo");
        const userData = await response.json();

        const profileStore = useProfileStore.getState();
        const sessionStore = useSessionStore.getState();

        profileStore.setGoogleProfile({
            name: userData.name || 'Usuário Google',
            avatar: userData.picture || '',
            provider: 'google',
            accessToken: accessToken,
        } as any);

        sessionStore.enterAuthenticated();
        profileStore.toggleDrive(true);

        // --- MUDANÇA AQUI ---
        // Não chamamos mais o restoreFromDrive() automaticamente.
        // Apenas iniciamos o Sync para os próximos salvamentos.
        initDriveSync();

    } catch (error) {
        console.error("[GoogleAuth]: Erro fatal no processamento do token:", error);
    }
}

/* -------------------------
    LISTENER DE INICIALIZAÇÃO
-------------------------- */
export function initAuthListener(): void {
    const sessionStore = useSessionStore.getState();
    const profileStore = useProfileStore.getState();

    if (isElectron && (window as any).electronAPI) {
        (window as any).electronAPI.onAuthCallback((url: string) => {
            const urlObj = new URL(url.replace('nesxtarc://', 'http://localhost/'));
            const params = new URLSearchParams(urlObj.hash.substring(1) || urlObj.search);
            const token = params.get('access_token') || params.get('token');

            if (token) {
                handleAuthSuccess({ accessToken: token });
            }
        });
    }

    // Na inicialização do App, apenas sincronizamos se já houver token
    if (sessionStore.isAuthenticated && profileStore.profile.accessToken) {
        if (!profileStore.driveEnabled) profileStore.toggleDrive(true);
        initDriveSync();
        return;
    }

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