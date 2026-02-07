import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

import { useSessionStore } from '../store/useSessionStore'
import { ROUTES } from '../routes/paths'

type Props = {
    children: ReactNode
}

export default function RequireAccess({ children }: Props) {
    const hasAccess = useSessionStore((state) => state.hasAccess)
    const hasHydrated = useSessionStore.persist.hasHydrated()


    if (!hasHydrated) {
        return null 
    }

    if (!hasAccess) {
        return <Navigate to={ROUTES.ACCESS} replace />
    }

    return <>{children}</>
}