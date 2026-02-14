import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useToast } from '../components/toast/useToast';

/* =========================
    TIPOS – ANIME & MANGÁ
========================= */

export type AnimeStatus = 'watching' | 'completed' | 'paused' | 'dropped' | 'planned'
export type ReadingStatus = 'reading' | 'completed' | 'paused' | 'dropped' | 'planned'

export interface AnimeItem {
  id: number
  title: string
  cover: string
  currentEpisode: number;
  currentSeason?: number; // ✅ ADICIONADO: Define que o anime pode ter temporada
  totalEpisodes: number;
  status: AnimeStatus
  type: 'anime'
  format?: string
  genres?: { name: string }[]
  addedAt: number
  updatedAt?: number
  lastAccessed?: number;
}

// ... Resto das interfaces (MangaItem, CardItem, etc) seguem iguais ...
export interface MangaItem {
  id: number
  title: string
  cover: string
  totalChapters: number
  currentChapter: number
  status: ReadingStatus
  type: 'manga'
  format?: string
  addedAt: number
  updatedAt?: number
  lastAccessed?: number;
}

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

  updateProgress: (id: number, episode: number, type: 'anime' | 'manga', season?: number) => void

  addXp: (amount: number) => void
  addCoins: (amount: number) => void
  spendCoins: (amount: number) => boolean
  addCardToInventory: (card: CardItem, packCost: number) => PackResult

  hasAnime: (id: number) => boolean
  hasManga: (id: number) => boolean
  getAnimeById: (id: number) => AnimeItem | undefined
  getMangaById: (id: number) => MangaItem | undefined
  resetStore: () => void
  syncWithExternal: (externalData: { animeList?: AnimeItem[], mangaList?: MangaItem[], coins?: number, xp?: number }) => void
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

      // ... addXp, addCoins, spendCoins, addCardToInventory, addAnime seguem iguais ...
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

      addAnime: (anime) => {
        // 🛡️ Trava de segurança: se já tem, não faz nada
        if (get().hasAnime(anime.id)) return;

        set((state) => ({
          animeList: [...state.animeList, {
            ...anime,
            type: 'anime',
            addedAt: anime.addedAt || Date.now(),
            updatedAt: Date.now()
          }],
        }));
      },

      updateAnime: (id, data) => set((state) => {
        const animeIndex = state.animeList.findIndex(a => String(a.id) === String(id));
        if (animeIndex === -1) return state;

        const anime = state.animeList[animeIndex];
        let extraCoins = 0;
        let extraXp = 0;

        if (data.currentEpisode && data.currentEpisode > anime.currentEpisode) {
          const diff = data.currentEpisode - anime.currentEpisode;
          extraXp = diff * 10;
          extraCoins = diff * 5;
        }

        const newList = [...state.animeList];
        newList[animeIndex] = { ...anime, ...data, updatedAt: Date.now() };

        return {
          coins: state.coins + extraCoins,
          xp: state.xp + extraXp,
          animeList: newList
        };
      }),

      removeAnime: (id) => set((state) => ({
        animeList: state.animeList.filter((a) => String(a.id) !== String(id)),
      })),

      addManga: (manga) => {
        // 🛡️ Trava de segurança: se já tem, não faz nada
        if (get().hasManga(manga.id)) return;

        set((state) => ({
          mangaList: [...state.mangaList, {
            ...manga,
            type: 'manga',
            addedAt: manga.addedAt || Date.now(),
            updatedAt: Date.now()
          }],
        }));
      },

      updateManga: (id, data) => set((state) => {
        const mangaIndex = state.mangaList.findIndex(m => String(m.id) === String(id));
        if (mangaIndex === -1) return state;

        const manga = state.mangaList[mangaIndex];
        let extraCoins = 0;
        let extraXp = 0;

        if (data.currentChapter && data.currentChapter > (manga.currentChapter || 0)) {
          const diff = data.currentChapter - (manga.currentChapter || 0);
          extraXp = diff * 5;
          extraCoins = diff * 2;
        }

        const newList = [...state.mangaList];
        newList[mangaIndex] = { ...manga, ...data, updatedAt: Date.now() };

        return {
          coins: state.coins + extraCoins,
          xp: state.xp + extraXp,
          mangaList: newList
        };
      }),

      removeManga: (id) => set((state) => ({
        mangaList: state.mangaList.filter((m) => String(m.id) !== String(id)),
      })),

      /* =========================
          LOGICA DE PROGRESSO CORRIGIDA
      ========================= */
      updateProgress: (id, value, type, season) => {
        const state = get();
        const isAnime = type === 'anime';

        if (isAnime) {
          const anime = state.animeList.find((a) => String(a.id) === String(id));
          if (!anime) return;

          // Resolvemos o erro "'season' is possibly undefined" usando um fallback (|| 1)
          const targetSeason = season || 1;
          const currentSeason = anime.currentSeason || 1;

          // Comparação segura: temporada maior OU (mesma temporada e episódio maior)
          const isNewer = (targetSeason > currentSeason) ||
            (targetSeason === currentSeason && value > anime.currentEpisode);

          if (isNewer) {
            const isCompleted = anime.totalEpisodes > 0 && value >= anime.totalEpisodes;

            get().updateAnime(id, {
              currentEpisode: value,
              currentSeason: targetSeason, // ✅ Agora o TS sabe que 'currentSeason' existe na interface
              status: isCompleted ? 'completed' : anime.status,
              lastAccessed: Date.now()
            });

            const { showToast } = useToast.getState();
            if (isCompleted) showToast(`Parabéns! Finalizou ${anime.title}!`, 'success', 5000);
          }
        } else {
          const manga = state.mangaList.find((m) => String(m.id) === String(id));
          if (!manga) return;

          if (value > (manga.currentChapter || 0)) {
            const isCompleted = manga.totalChapters > 0 && value >= manga.totalChapters;

            get().updateManga(id, {
              currentChapter: value,
              status: isCompleted ? 'completed' : manga.status,
              lastAccessed: Date.now()
            });

            const { showToast } = useToast.getState();
            if (isCompleted) showToast(`Parabéns! Finalizou ${manga.title}!`, 'success', 5000);
          }
        }
      },

      hasAnime: (id) => get().animeList.some((a) => String(a.id) === String(id)),
      hasManga: (id) => get().mangaList.some((m) => String(m.id) === String(id)),
      getAnimeById: (id) => get().animeList.find((a) => String(a.id) === String(id)),
      getMangaById: (id) => get().mangaList.find((m) => String(m.id) === String(id)),

      resetStore: () => set({
        animeList: [],
        mangaList: [],
        coins: 500,
        xp: 0,
        inventory: [],
      }),

      syncWithExternal: (externalData) => {
        const state = get();
        set({
          animeList: externalData.animeList ? externalData.animeList.map(ext => {
            const local = state.animeList.find(l => String(l.id) === String(ext.id));
            if (!local) return ext;
            return (ext.updatedAt || 0) > (local.updatedAt || 0) ? ext : local;
          }) : state.animeList,

          mangaList: externalData.mangaList ? externalData.mangaList.map(ext => {
            const local = state.mangaList.find(l => String(l.id) === String(ext.id));
            if (!local) return ext;
            return (ext.updatedAt || 0) > (local.updatedAt || 0) ? ext : local;
          }) : state.mangaList,

          coins: Math.max(state.coins, externalData.coins || 0),
          xp: Math.max(state.xp, externalData.xp || 0),
        });
      },
    }),
    {
      name: 'otaku-library',
      storage: createJSONStorage(() => localStorage),
    }
  )
)