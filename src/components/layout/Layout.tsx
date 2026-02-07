import type { ReactNode } from 'react'
import Header from './Header'
import BottomNav from './BottomNav'
import { useProfileStore } from '../../store/useProfileStore'
import { getContrastColor } from '../../utils/colors'

export default function Layout({ children }: { children: ReactNode }) {
  const theme = useProfileStore((state) => state.profile.theme)
  const textColor = getContrastColor(theme.background)

  return (
    <div
      id="main-content"
      className="transition-colors duration-500"
      style={{
        backgroundColor: theme.background,
        color: textColor
      }}
    >
      {/* HEADER FIXED (Configurado no CSS) */}
      <Header />

      {/* CONTEÚDO COM PADDING PARA COMPENSAR O HEADER */}
      <main>
        <div className="max-w-7xl mx-auto w-full pb-24 px-4">
          {children}
        </div>
      </main>

      {/* BOTTOM NAV FIXED */}
      <BottomNav />
    </div>
  )
}