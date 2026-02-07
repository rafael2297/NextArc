import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

/* =========================
    TIPOS – ANIME & MANGÁ
========================= */

export type AnimeStatus = 'watching' | 'completed' | 'paused' | 'dropped' | 'planned'
export type ReadingStatus = 'reading' | 'completed' | 'paused' | 'dropped' | 'planned'

export interface AnimeItem {
  id: number
  title: string
  cover: string
  totalEpisodes: number
  currentEpisode: number
  status: AnimeStatus
  type: 'anime'   // <--- ADICIONADO: Força o tipo para o card não errar
  format?: string // <--- ADICIONADO: Para mostrar "TV", "Movie", etc.
  genres?: { name: string }[]
  addedAt: number
  updatedAt?: number
}

export interface MangaItem {
  id: number
  title: string
  cover: string
  totalChapters: number
  currentChapter: number
  status: ReadingStatus
  type: 'manga'   // <--- ADICIONADO: Força o tipo
  format?: string // <--- ADICIONADO: Para mostrar "Manga", "Manhwa", etc.
  addedAt: number
  updatedAt?: number
}

/* =========================
    TIPOS – COLEÇÃO (TCG)
========================= */

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface CardItem {
  id: number
  animeId: number
  name: string
  image: string
  rarity: Rarity
  animeTitle: string
  collectedAt: number
}

export interface PackResult {
  duplicate: boolean
  refund: number
  card: CardItem
}

/* =========================
    STORE INTERFACE
========================= */

export interface AppState {
  animeList: AnimeItem[]
  mangaList: MangaItem[]
  coins: number
  xp: number
  inventory: CardItem[]

  addAnime: (anime: Omit<AnimeItem, 'addedAt' | 'type'> & { addedAt?: number }) => void
  updateAnime: (id: number, data: Partial<AnimeItem>) => void
  removeAnime: (id: number) => void

  addManga: (manga: Omit<MangaItem, 'addedAt' | 'type'> & { addedAt?: number }) => void
  updateManga: (id: number, data: Partial<MangaItem>) => void
  removeManga: (id: number) => void

  addXp: (amount: number) => void
  addCoins: (amount: number) => void
  spendCoins: (amount: number) => boolean
  addCardToInventory: (card: CardItem, packCost: number) => PackResult

  hasAnime: (id: number) => boolean
  hasManga: (id: number) => boolean
  getAnimeById: (id: number) => AnimeItem | undefined
  getMangaById: (id: number) => MangaItem | undefined
  resetStore: () => void
}

/* =========================
    STORE IMPLEMENTATION
========================= */

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      animeList: [],
      mangaList: [],
      coins: 500,
      xp: 0,
      inventory: [],

      addXp: (amount) => set((state) => ({ xp: state.xp + amount })),
      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),

      spendCoins: (amount) => {
        const currentCoins = get().coins
        if (currentCoins >= amount) {
          set({ coins: currentCoins - amount })
          return true
        }
        return false
      },

      addCardToInventory: (card, packCost) => {
        const state = get()
        const isDuplicate = state.inventory.some(
          (item) => item.id === card.id && item.animeId === card.animeId
        )

        if (isDuplicate) {
          const refundMultipliers: Record<Rarity, number> = {
            common: 0.15,
            rare: 0.25,
            epic: 0.40,
            legendary: 0.60
          }
          const refundAmount = Math.floor(packCost * refundMultipliers[card.rarity])
          set((s) => ({ coins: s.coins + refundAmount, xp: s.xp + 5 }))
          return { duplicate: true, refund: refundAmount, card }
        }

        set((s) => ({
          inventory: [{ ...card, collectedAt: Date.now() }, ...s.inventory],
          xp: s.xp + 20
        }))
        return { duplicate: false, refund: 0, card }
      },

      addAnime: (anime) => set((state) => ({
        animeList: [...state.animeList, {
          ...anime,
          type: 'anime', // Garante que o tipo seja salvo corretamente
          addedAt: anime.addedAt || Date.now(),
          updatedAt: Date.now()
        }],
      })),

      updateAnime: (id, data) => set((state) => {
        const anime = state.animeList.find(a => a.id === id)
        if (anime && data.currentEpisode && data.currentEpisode > anime.currentEpisode) {
          const diff = data.currentEpisode - anime.currentEpisode
          state.addXp(diff * 10)
          state.addCoins(diff * 5)
        }
        return {
          animeList: state.animeList.map((a) =>
            a.id === id ? { ...a, ...data, updatedAt: Date.now() } : a
          ),
        }
      }),

      removeAnime: (id) => set((state) => ({
        animeList: state.animeList.filter((a) => a.id !== id),
      })),

      addManga: (manga) => set((state) => ({
        mangaList: [...state.mangaList, {
          ...manga,
          type: 'manga', // Garante que o tipo seja salvo corretamente
          addedAt: manga.addedAt || Date.now(),
          updatedAt: Date.now()
        }],
      })),

      updateManga: (id, data) => set((state) => {
        const manga = state.mangaList.find(m => m.id === id)
        if (manga && data.currentChapter && data.currentChapter > manga.currentChapter) {
          const diff = data.currentChapter - manga.currentChapter
          state.addXp(diff * 5)
          state.addCoins(diff * 2)
        }
        return {
          mangaList: state.mangaList.map((m) =>
            m.id === id ? { ...m, ...data, updatedAt: Date.now() } : m
          ),
        }
      }),

      removeManga: (id) => set((state) => ({
        mangaList: state.mangaList.filter((m) => m.id !== id),
      })),

      hasAnime: (id) => get().animeList.some((a) => a.id === id),
      hasManga: (id) => get().mangaList.some((m) => m.id === id),
      getAnimeById: (id) => get().animeList.find((a) => a.id === id),
      getMangaById: (id) => get().mangaList.find((m) => m.id === id),

      resetStore: () => set({
        animeList: [],
        mangaList: [],
        coins: 500,
        xp: 0,
        inventory: [],
      }),
    }),
    {
      name: 'otaku-library',
      storage: createJSONStorage(() => localStorage),
    }
  )
)