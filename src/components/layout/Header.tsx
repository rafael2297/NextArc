import { useLocation, Link } from 'react-router-dom'
import { ROUTES } from '../../routes/paths'
import { useProfileStore } from '../../store/useProfileStore'
import { hexToRgba, getContrastColor, getBorderColor } from '../../utils/colors'
import { Settings } from 'lucide-react' // Importando o ícone de engrenagem

export default function Header() {
  const location = useLocation()
  const theme = useProfileStore((state) => state.profile.theme)

  const transparentHeaderRoutes: string[] = [ROUTES.SEARCH, ROUTES.ACCESS]
  if (transparentHeaderRoutes.includes(location.pathname)) return null

  // Cores dinâmicas
  const textColor = getContrastColor(theme.navbar)
  const borderColor = getBorderColor(theme.background)

  return (
    <header
      className="fixed top-0 left-0 right-0 h-16 backdrop-blur-xl border-b z-50 flex items-center justify-between px-6 max-w-[100vw] overflow-hidden"
      style={{
        backgroundColor: hexToRgba(theme.navbar, 0.6),
        borderColor: borderColor
      }}
    >
      <div className="flex items-center gap-2">
        {/* Logo Container */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300"
          style={{
            backgroundColor: theme.primary,
            boxShadow: `0 0 20px ${hexToRgba(theme.primary, 0.4)}`
          }}
        >
          <span
            className="font-black text-xl italic"
            style={{ color: getContrastColor(theme.primary) }}
          >
            N
          </span>
        </div>

        <h1
          className="text-lg font-bold bg-clip-text text-transparent italic bg-gradient-to-r"
          style={{ backgroundImage: `linear-gradient(to right, ${textColor}, ${hexToRgba(textColor, 0.5)})` }}
        >
          NextArc
        </h1>
      </div>

      {/* Botão de Configurações */}
      <Link
        to={ROUTES.SETTINGS}
        className="p-2 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95 group"
        style={{
          backgroundColor: hexToRgba(textColor, 0.05),
          color: textColor
        }}
      >
        <Settings
          size={20}
          className="group-hover:rotate-90 transition-transform duration-500 ease-in-out"
        />
      </Link>
    </header>
  )
}