import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { DownloadCloud, CheckCircle2 } from 'lucide-react'

// COMPONENTES E LAYOUT
import Layout from './components/layout/Layout'
import { ToastContainer } from './components/toast/ToastContainer'
import { useToast } from './components/toast/useToast'
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
  const { showToast } = useToast()

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

  // 2. VERIFICAÇÃO AUTOMÁTICA DO TOKEN E UPDATES
  useEffect(() => {
    if (isLoaded) {
      // --- LÓGICA DO TOKEN GOOGLE DRIVE ---
      const state = useProfileStore.getState()
      const driveEnabled = state.driveEnabled
      const accessToken = state.profile?.accessToken
      const isTokenInvalid = !accessToken || accessToken.includes('nesxtarc://')

      if (driveEnabled && isTokenInvalid) {
        setTimeout(() => exportToDrive(), 1000)
      }

      if (accessToken && !isTokenInvalid) {
        initAuthListener()
        restoreFromDrive().finally(() => initDriveSync())
      }

      // --- LÓGICA DE ATUALIZAÇÃO DO APP NO App.tsx ---
      if ((window as any).electronAPI) {

        const unsubscribeUpdate = (window as any).electronAPI.onUpdateAvailable((info: any) => {
          showToast({
            title: "Nova Atualização!",
            message: `A versão ${info.version} está disponível.`,
            type: 'info',
            duration: 15000,
            action: {
              label: "ATUALIZAR",
              onClick: () => (window as any).electronAPI.downloadUpdate()
            }
          })
        })

        const unsubscribeReady = (window as any).electronAPI.onUpdateReady(() => {
          showToast({
            title: "Pronto para Instalar!",
            message: "Reinicie o app para aplicar a atualização.",
            type: 'success',
            duration: 0, // Mantém aberto
            action: {
              label: "REINICIAR",
              onClick: () => (window as any).electronAPI.quitAndInstall()
            }
          })
        })

        return () => {
          if (unsubscribeUpdate) unsubscribeUpdate()
          if (unsubscribeReady) unsubscribeReady()
        }
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