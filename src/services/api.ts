// src/services/api.ts
export const API_BASE =
    window.location.protocol === 'file:'
        ? 'http://127.0.0.1:3000'
        : 'http://localhost:3000'
