import { useLocation, Link } from 'react-router-dom'
import { ROUTES } from '../../routes/paths'
import { useProfileStore } from '../../store/useProfileStore'
import { hexToRgba, getContrastColor } from '../../utils/colors'
import { Settings } from 'lucide-react'

export default function Header() {
  const location = useLocation()
  const theme = useProfileStore((state) => state.profile.theme)

  // Rotas onde o Header não deve aparecer
  const transparentHeaderRoutes: string[] = [ROUTES.SEARCH, ROUTES.ACCESS]
  if (transparentHeaderRoutes.includes(location.pathname)) return null

  // Cores dinâmicas
  const textColor = getContrastColor(theme.navbar)

  return (
    <header
      className="
        fixed
        top-0
        left-0
        right-0
        h-16
        backdrop-blur-xl
        border-b
        z-[100]
        flex
        items-center
        justify-between
        px-6
        w-full
        transition-all
        duration-300
      "
      style={{
        backgroundColor: hexToRgba(theme.navbar, 0.7), // Opacidade levemente maior para leitura no scroll
        borderColor: hexToRgba(textColor, 0.08)
      }}
    >
      {/* Lado Esquerdo: Logo e Identidade */}
      <div className="flex items-center gap-3">
        {/* Logo Container */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg"
          style={{
            backgroundColor: theme.primary,
            boxShadow: `0 8px 16px ${hexToRgba(theme.primary, 0.2)}`
          }}
        >
          <span
            className="font-black text-xl italic"
            style={{ color: getContrastColor(theme.primary) }}
          >
            N
          </span>
        </div>

        <div className="flex flex-col">
          <h1
            className="text-lg font-black italic leading-none tracking-tight"
            style={{ color: textColor }}
          >
            NextArc
          </h1>
        </div>
      </div>

      {/* Lado Direito: Ações */}
      <div className="flex items-center gap-2">
        <Link
          to={ROUTES.SETTINGS}
          className="p-2.5 rounded-2xl transition-all duration-300 hover:scale-110 active:scale-95 group backdrop-blur-md"
          style={{
            backgroundColor: hexToRgba(textColor, 0.05),
            color: textColor,
            border: `1px solid ${hexToRgba(textColor, 0.1)}`
          }}
        >
          <Settings
            size={18}
            className="group-hover:rotate-45 transition-transform duration-500 ease-in-out"
          />
        </Link>
      </div>
    </header>
  )
}