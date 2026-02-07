import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Search, Calendar, Library, LayoutDashboard } from 'lucide-react'
import { ROUTES } from '../../routes/paths'
import { useProfileStore } from '../../store/useProfileStore'
import { hexToRgba, getContrastColor, getBorderColor } from '../../utils/colors'

export default function BottomNav() {
  const location = useLocation()
  const theme = useProfileStore((state) => state.profile.theme)
  const hiddenRoutes: string[] = [ROUTES.ACCESS]

  if (hiddenRoutes.includes(location.pathname)) return null

  const navItems = [
    { path: ROUTES.HOME, icon: Home, label: 'Home' },
    { path: ROUTES.SEARCH, icon: Search, label: 'Buscar' },
    { path: ROUTES.SEASONAL, icon: Calendar, label: 'Época' },
    { path: ROUTES.LIBRARY, icon: Library, label: 'Biblioteca' },
    { path: ROUTES.PROFILE, icon: LayoutDashboard, label: 'Status' },
  ]

  const navTextColor = getContrastColor(theme.navbar)
  const borderColor = getBorderColor(theme.background)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-20 backdrop-blur-xl border-t z-[100] px-2 pb-[env(safe-area-inset-bottom)]"
      style={{
        backgroundColor: hexToRgba(theme.navbar, 0.6),
        borderColor: borderColor
      }}
    >
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path

          return (
            <NavLink key={item.path} to={item.path} className="relative flex flex-col items-center justify-center w-full h-full">
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-x-2 inset-y-3 rounded-2xl"
                  style={{ backgroundColor: hexToRgba(theme.primary, 0.15) }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <motion.div
                animate={{ y: isActive ? -2 : 0, scale: isActive ? 1.1 : 1 }}
                className="relative z-10"
                style={{ color: isActive ? theme.primary : hexToRgba(navTextColor, 0.5) }}
              >
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>

              <span
                className="text-[10px] mt-1 font-bold z-10 transition-colors"
                style={{ color: isActive ? theme.primary : hexToRgba(navTextColor, 0.4) }}
              >
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}