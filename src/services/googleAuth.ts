import {
    signInWithPopup,
    signOut,
    deleteUser,
    onAuthStateChanged,
    type User,
    GoogleAuthProvider,
} from 'firebase/auth'

import { auth, googleProvider } from './firebase'
import { useProfileStore } from '../store/useProfileStore'
import { useSessionStore } from '../store/useSessionStore'
import { restoreFromDrive, initDriveSync } from './driveSync'

// CONFIGURAÇÃO DE ESCOPOS (Fundamental para evitar 401 de permissão)
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.setCustomParameters({ prompt: 'select_account' });

function mapFirebaseUser(user: User) {
    return {
        name: user.displayName ?? 'Usuário Google',
        avatar: user.photoURL ?? '',
        provider: 'google' as const,
    }
}

/* -------------------------
    LOGIN MANUAL (POPUP)
-------------------------- */
export async function signInWithGoogle(): Promise<void> {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);

        if (!credential?.accessToken) {
            throw new Error('TOKEN_NOT_FOUND');
        }

        const profileStore = useProfileStore.getState();
        const sessionStore = useSessionStore.getState();

        profileStore.setGoogleProfile({
            ...mapFirebaseUser(result.user),
            accessToken: credential.accessToken,
        });

        sessionStore.enterAuthenticated();

        profileStore.toggleDrive(true);

        await restoreFromDrive(false);

        initDriveSync();

    } catch (error: any) {
        console.error("Erro no Login Google:", error);
        throw error;
    }
}

/* -------------------------
    AUTO LOGIN (LISTENER)
-------------------------- */
export function initAuthListener(): void {
    onAuthStateChanged(auth, async (user) => {
        const sessionStore = useSessionStore.getState();
        const profileStore = useProfileStore.getState();

        if (!user) {
            if (sessionStore.isAuthenticated) {
                sessionStore.logout();
                profileStore.resetProfile();
            }
            return;
        }

        if (!sessionStore.isAuthenticated) {
            sessionStore.enterAuthenticated();
        }

        if (!profileStore.profile.provider) {
            profileStore.setGoogleProfile(mapFirebaseUser(user));
        }

        if (profileStore.profile.accessToken) {

            if (!profileStore.driveEnabled) {
                profileStore.toggleDrive(true);
            }


            await restoreFromDrive(false).catch(() => { });

            initDriveSync();
        }
    });
}

/* -------------------------
    LOGOUT
-------------------------- */
export async function signOutGoogle(): Promise<void> {
    try {
        await signOut(auth);
        useProfileStore.getState().resetProfile();
        useSessionStore.getState().logout();
    } catch (error) {
        console.error("Erro ao deslogar:", error);
    }
}

/* -------------------------
    EXCLUIR CONTA
-------------------------- */
export async function deleteGoogleAccount(): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    try {
        await deleteUser(user);
        useProfileStore.getState().resetProfile();
        useSessionStore.getState().logout();
    } catch (error) {
        console.error("Erro ao eliminar conta:", error);
        throw error;
    }
}