import { useAppStore } from '../store/useAppStore'
import { useProfileStore } from '../store/useProfileStore'
import { useThemeStore } from '../store/useThemeStore'
import { saveFileToDrive, loadFileFromDrive } from './googleDrive'
import { useToast } from '../components/toast/useToast'

const FILE_NAME = 'otaku-library.json'

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let lastHash = ''
let applyingRemote = false
let hasRestoredOnce = false

/* =========================
   HELPERS
========================= */

function hash(data: unknown): string {
    return JSON.stringify(data)
}

function cleanToken(token?: string | null): string | null {
    if (!token) return null
    return token
        .replace('nextarc://auth/', '')
        .replace('nextarc://auth', '')
}

/* =========================
    STORE → BACKUP (SNAPSHOT)
========================= */

function buildBackup() {
    const app = useAppStore.getState()
    const theme = useThemeStore.getState()
    const profile = useProfileStore.getState().profile

    const lastUpdatedAt = Math.max(
        ...app.animeList.map(a => a.updatedAt || 0),
        ...app.mangaList.map(m => m.updatedAt || 0),
        0
    )

    return {
        version: 5,
        updatedAt: lastUpdatedAt || Date.now(),

        animes: app.animeList,
        mangas: app.mangaList,

        rpg: {
            coins: app.coins,
            xp: app.xp,
            inventory: app.inventory,
        },
        // ... restante do objeto (theme, user)
        theme: {
            primaryColor: theme.primaryColor,
            primaryGlow: theme.primaryGlow,
            backgroundImage: theme.backgroundImage,
        },
        user: {
            name: profile.name,
            avatar: profile.avatar,
            provider: 'google',
        },
    }
}

/* =========================
   BACKUP → STORE
========================= */

function applyBackup(backup: any): boolean {
    const app = useAppStore.getState()
    const showToast = useToast.getState().showToast

    const isLocalEmpty =
        app.animeList.length === 0 &&
        app.mangaList.length === 0

    const localUpdatedAt = Math.max(
        ...app.animeList.map(a => a.updatedAt || 0),
        ...app.mangaList.map(m => m.updatedAt || 0),
        0
    )

    // 🔒 Regra de ouro
    if (!isLocalEmpty && localUpdatedAt > (backup.updatedAt || 0)) {
        console.log('⏩ Local mais recente que o Drive. Restore ignorado.')
        return false
    }

    applyingRemote = true
    try {
        useAppStore.setState({
            animeList: backup.animes ?? [],
            mangaList: backup.mangas ?? [],
            coins: backup.rpg?.coins ?? app.coins,
            xp: backup.rpg?.xp ?? app.xp,
            inventory: backup.rpg?.inventory ?? app.inventory,
        })

        if (backup.theme) {
            useThemeStore.setState({
                primaryColor: backup.theme.primaryColor,
                primaryGlow: backup.theme.primaryGlow,
                backgroundImage: backup.theme.backgroundImage,
            })
        }

        lastHash = hash(buildBackup())
        showToast('Dados restaurados do Drive!', 'success')
        return true
    } finally {
        applyingRemote = false
    }
}

/* =========================
   RESTORE
========================= */

export async function restoreFromDrive(): Promise<void> {
    if (hasRestoredOnce) return

    const profileStore = useProfileStore.getState()
    const token = cleanToken(profileStore.profile.accessToken)

    if (!token) {
        hasRestoredOnce = true
        return
    }

    try {
        const remote = await loadFileFromDrive(FILE_NAME, token)

        if (!remote) {
            hasRestoredOnce = true
            return
        }

        applyBackup(remote)
        hasRestoredOnce = true

    } catch (err: any) {
        console.warn('[Drive] Restore falhou, seguindo com dados locais')
        hasRestoredOnce = true

        // 👉 token expirado
        if (err?.message === 'TOKEN_EXPIRED') {
            console.warn('[Drive] Token expirado, desativando Drive')

            profileStore.updateProfile({ accessToken: undefined })
            profileStore.toggleDrive(false)
        }
    }
}



/* =========================
   SYNC AUTOMÁTICO
========================= */

export function initDriveSync(): void {
    useAppStore.subscribe(() => {
        const profile = useProfileStore.getState()
        const token = cleanToken(profile.profile.accessToken)

        if (
            !token ||
            !profile.driveEnabled ||
            applyingRemote ||
            !hasRestoredOnce
        ) {
            return
        }

        const backup = buildBackup()
        const currentHash = hash(backup)

        if (lastHash === '') {
            lastHash = currentHash
            return
        }

        if (currentHash === lastHash) return

        if (debounceTimer) clearTimeout(debounceTimer)

        debounceTimer = setTimeout(async () => {
            try {
                await saveFileToDrive(FILE_NAME, backup, token)
                lastHash = currentHash
                console.log('☁️ Drive Sync atualizado')
            } catch (err: any) {
                console.error('Erro no sync:', err)

                if (err?.status === 401) {
                    useProfileStore.setState({ driveEnabled: false })
                    useToast.getState().showToast(
                        'Sessão expirada. Reconecte o Google Drive.',
                        'error',
                        8000
                    )
                }
            }
        }, 4000)
    })
}
