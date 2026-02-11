import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'

// COMPONENTES E LAYOUT
import Layout from './components/layout/Layout'
import { ToastContainer } from './components/toast/ToastContainer'
import ThemeHandler from './components/ThemeHandler'
import RequireAccess from './components/RequireAccess'

// PÁGINAS
import Home from './pages/Home'
import Search from './pages/Search'
import Seasonal from './pages/Seasonal'
import Library from './pages/Library'
import ChooseAccess from './pages/ChooseAccess'
import Dashboard from './pages/Dashboard'
import Shop from './pages/Shop'
import Inventory from './pages/Inventory'
import Settings from './pages/Settings'
import MediaDetailsContainer from './pages/media/MediaDetails.container'

// ROTAS E ESTADOS
import { ROUTES } from './routes/paths'
import { useProfileStore } from './store/useProfileStore'
import { useSessionStore } from './store/useSessionStore'
import { useProfileController } from './hooks/useSettingsController'

// SERVIÇOS
import { initAuthListener, handleAuthSuccess } from './services/googleAuth'
import { initDriveSync, restoreFromDrive } from './services/driveSync'

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false)

  // Importamos o controller para usar a lógica de verificação
  const { exportToDrive } = useProfileController()

  // 1. CARREGAMENTO INICIAL
  useEffect(() => {
    const initApp = async () => {
      try {
        await Promise.all([
          useSessionStore.persist.rehydrate(),
          useProfileStore.persist.rehydrate()
        ])
      } catch (e) {
        console.error("Erro na inicialização:", e)
      } finally {
        setIsLoaded(true)
      }
    }
    initApp()
  }, [])

  // 2. VERIFICAÇÃO AUTOMÁTICA DO TOKEN (AO ABRIR)
  useEffect(() => {
    if (isLoaded) {
      const state = useProfileStore.getState()
      const driveEnabled = state.driveEnabled
      const accessToken = state.profile?.accessToken

      // Verifica se o token é inválido ou um link de erro
      const isTokenInvalid = !accessToken || accessToken.includes('nesxtarc://')

      if (driveEnabled && isTokenInvalid) {
        // Delay de 1s para o ToastContainer estar pronto na tela
        const timer = setTimeout(() => {
          exportToDrive()
        }, 1000)
        return () => clearTimeout(timer)
      }

      // Se estiver tudo OK, inicia os serviços normais
      if (accessToken && !isTokenInvalid) {
        initAuthListener()
        restoreFromDrive().finally(() => initDriveSync())
      }
    }
  }, [isLoaded])

  // 3. CALLBACK DO ELECTRON (DEEP LINK)
  useEffect(() => {
    if ((window as any).electronAPI) {
      const unsubscribe = (window as any).electronAPI.onAuthCallback((url: string) => {
        try {
          const normalizedUrl = url.replace('nesxtarc://auth/', 'http://localhost/').replace('nesxtarc://auth', 'http://localhost/')
          const urlObj = new URL(normalizedUrl)
          const params = new URLSearchParams(urlObj.hash.substring(1) || urlObj.search)
          const accessToken = params.get('token') || params.get('access_token')

          if (accessToken) {
            handleAuthSuccess({ accessToken })
          }
        } catch (error) {
          console.error("Erro no callback de auth:", error)
        }
      })
      return () => { if (unsubscribe) unsubscribe() }
    }
  }, [])

  if (!isLoaded) return <div className="h-screen w-screen bg-black" />

  return (
    <HashRouter>
      <div id="main-content">
        <ThemeHandler />
        <Layout>
          <Routes>
            <Route path={ROUTES.HOME} element={<Home />} />
            <Route path={ROUTES.SEARCH} element={<Search />} />
            <Route path={ROUTES.SEASONAL} element={<Seasonal />} />
            <Route path={ROUTES.ACCESS} element={<ChooseAccess />} />
            <Route path="/media/:type/:id" element={<MediaDetailsContainer />} />
            <Route path={ROUTES.LIBRARY} element={<RequireAccess><Library /></RequireAccess>} />
            <Route path={ROUTES.PROFILE} element={<RequireAccess><Dashboard /></RequireAccess>} />
            <Route path={ROUTES.SETTINGS} element={<RequireAccess><Settings /></RequireAccess>} />
            <Route path={ROUTES.SHOP} element={<RequireAccess><Shop /></RequireAccess>} />
            <Route path={ROUTES.INVENTORY} element={<RequireAccess><Inventory /></RequireAccess>} />
          </Routes>
        </Layout>
      </div>
      <ToastContainer />
    </HashRouter>
  )
}