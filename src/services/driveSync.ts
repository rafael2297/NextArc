import { useAppStore } from '../store/useAppStore'
import { useProfileStore } from '../store/useProfileStore'
import { saveFileToDrive, loadFileFromDrive } from './googleDrive'
import { useToast } from '../components/toast/useToast'
import type {
    AnimeStatus,
    ReadingStatus,
} from '../store/useAppStore'

const FILE_NAME = 'otaku-library.json'

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let lastHash = ''
let applyingRemote = false

/* =========================
    HELPERS
========================= */

function hash(data: unknown): string {
    return JSON.stringify(data)
}

function isAnimeStatus(value: string): value is AnimeStatus {
    return ['watching', 'completed', 'paused', 'dropped', 'planned'].includes(value)
}

function isReadingStatus(value: string): value is ReadingStatus {
    return ['reading', 'completed', 'paused', 'dropped', 'planned'].includes(value)
}

/* =========================
    STORE → BACKUP (GERAR)
========================= */

function buildBackup(): any {
    const { animeList, mangaList, coins, xp, inventory } = useAppStore.getState()
    const profile = useProfileStore.getState().profile

    const lastLocalUpdate = Math.max(
        ...animeList.map(a => a.updatedAt || 0),
        ...mangaList.map(m => m.updatedAt || 0),
        0
    )

    return {
        version: 2,
        animes: animeList.map(a => ({
            id: a.id,
            title: a.title,
            cover: a.cover,
            progress: a.currentEpisode,
            total: a.totalEpisodes,
            status: a.status,
            updatedAt: a.updatedAt || a.addedAt,
        })),
        mangas: mangaList.map(m => ({
            id: m.id,
            title: m.title,
            cover: m.cover,
            progress: m.currentChapter,
            total: m.totalChapters,
            status: m.status,
            updatedAt: m.updatedAt || m.addedAt,
        })),
        rpg: { coins, xp, inventory },
        updatedAt: lastLocalUpdate || Date.now(),
        user: {
            name: profile.name,
            avatar: profile.avatar,
            provider: 'google',
        },
    }
}

/* =========================
    BACKUP → STORE (APLICAR)
========================= */

function applyBackup(backup: any, force = false): boolean {
    const store = useAppStore.getState()
    const showToast = useToast.getState().showToast

    const localAnimes = store.animeList
    const localMangas = store.mangaList

    const localUpdatedAt = Math.max(
        ...localAnimes.map(a => a.updatedAt || 0),
        ...localMangas.map(m => m.updatedAt || 0),
        0
    )

    if (!force) {
        const isLocalEmpty = localAnimes.length === 0 && localMangas.length === 0;

        if (!isLocalEmpty && backup.updatedAt && backup.updatedAt < localUpdatedAt) {
            console.warn("⚠️ Sync bloqueado: O arquivo na nuvem é mais antigo que os dados atuais.");
            return false
        }
    }

    applyingRemote = true
    store.resetStore()

    backup.animes?.forEach((a: any) => {
        store.addAnime({
            id: a.id,
            title: a.title,
            cover: a.cover,
            totalEpisodes: a.total,
            currentEpisode: a.progress,
            status: isAnimeStatus(a.status) ? a.status : 'planned',
            addedAt: a.updatedAt,
        })
    })

    backup.mangas?.forEach((m: any) => {
        store.addManga({
            id: m.id,
            title: m.title,
            cover: m.cover,
            totalChapters: m.total,
            currentChapter: m.progress,
            status: isReadingStatus(m.status) ? m.status : 'planned',
            format: 'manga',
            addedAt: m.updatedAt,
        })
    })

    if (backup.rpg) {
        useAppStore.setState({
            coins: backup.rpg.coins ?? 0,
            xp: backup.rpg.xp ?? 0,
            inventory: backup.rpg.inventory ?? []
        })
    }

    applyingRemote = false
    showToast('Dados sincronizados com a nuvem!', 'success')
    return true
}

/* =========================
    RESTORE
========================= */

export async function restoreFromDrive(force = false): Promise<void> {
    const { accessToken } = useProfileStore.getState().profile
    if (!accessToken) return

    try {
        const remote = await loadFileFromDrive(FILE_NAME, accessToken)
        if (!remote) return

        const success = applyBackup(remote, force)
        if (success) {
            lastHash = hash(remote)
        }
    } catch (error: any) {
        console.error("Erro no Restore:", error)
        if (error.message === 'TOKEN_EXPIRED') {
            throw error;
        }
    }
}

/* =========================
    SYNC (AUTO-SAVE)
========================= */

export function initDriveSync(): void {
    useAppStore.subscribe(() => {
        const { accessToken } = useProfileStore.getState().profile
        const driveEnabled = useProfileStore.getState().driveEnabled

        if (!accessToken || !driveEnabled || applyingRemote) return

        const backup = buildBackup()
        const currentHash = hash(backup)

        if (currentHash === lastHash) return
        if (debounceTimer) clearTimeout(debounceTimer)

        debounceTimer = setTimeout(async () => {
            try {
                await saveFileToDrive(FILE_NAME, backup, accessToken)
                lastHash = currentHash
                console.log("Drive Sync: Backup atualizado.");
            } catch (error: any) {
                console.error("Erro no Sync Automático:", error)
            }
        }, 5000)
    })
}