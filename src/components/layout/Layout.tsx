import type { ReactNode } from 'react'
import Header from './Header'
import BottomNav from './BottomNav'
import { useProfileStore } from '../../store/useProfileStore'
import { getContrastColor } from '../../utils/colors'

export default function Layout({ children }: { children: ReactNode }) {
  const theme = useProfileStore((state) => state.profile.theme)

  // Define a cor do texto base (preto ou branco) baseado no fundo escolhido
  const textColor = getContrastColor(theme.background)

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-500"
      style={{
        backgroundColor: theme.background,
        color: textColor
      }}
    >
      <Header />

      <main className="flex-1 pt-16 pb-20">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}