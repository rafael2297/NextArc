export const ROUTES = {
    HOME: '/',
    SEARCH: '/search',
    SEASONAL: '/seasonal',
    LIBRARY: '/library',
    ACCESS: '/choose-access',
    PROFILE: '/dashboard',
    SETTINGS: '/settings', 
    SHOP: '/shop',      
    INVENTORY: '/inventory', 
    MEDIA_DETAILS: (type: 'anime' | 'manga', id: number) =>
        `/media/${type}/${id}`,
} as const