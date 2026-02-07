import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Layout from './components/layout/Layout'
import { ToastContainer } from './components/toast/ToastContainer'
import ThemeHandler from './components/ThemeHandler' // <-- Novo import

// Páginas principais
import Home from './pages/Home'
import Search from './pages/Search'
import Seasonal from './pages/Seasonal'
import Library from './pages/Library'
import ChooseAccess from './pages/ChooseAccess'

// Páginas do Sistema de RPG e Perfil
import Dashboard from './pages/Dashboard'
import Shop from './pages/Shop'
import Inventory from './pages/Inventory'
import Settings from './pages/Settings'

import MediaDetailsContainer from './pages/media/MediaDetails.container'
import RequireAccess from './components/RequireAccess'
import { ROUTES } from './routes/paths'

import { initAuthListener } from './services/googleAuth'
// IMPORTANTE: Importar o serviço de Sync
import { initDriveSync, restoreFromDrive } from './services/driveSync'
import { useProfileStore } from './store/useProfileStore'

export default function App() {

  useEffect(() => {
    // 1. Inicia o ouvinte de autenticação do Google
    initAuthListener()

    // 2. Inicia o monitoramento de mudanças na Store para auto-save
    initDriveSync()

    // 3. Tenta restaurar os dados assim que o app abre (se houver token)
    const token = useProfileStore.getState().profile.accessToken
    if (token) {
      restoreFromDrive()
    }
  }, [])

  return (
    <BrowserRouter>
      {/* O ThemeHandler fica aqui, fora do Layout, para garantir que as cores 
          sejam injetadas antes de qualquer componente renderizar */}
      <ThemeHandler />

      <Layout>
        <Routes>
          {/* Rotas Públicas */}
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.SEARCH} element={<Search />} />
          <Route path={ROUTES.SEASONAL} element={<Seasonal />} />
          <Route path={ROUTES.ACCESS} element={<ChooseAccess />} />

          <Route
            path="/media/:type/:id"
            element={<MediaDetailsContainer />}
          />

          {/* Rotas Protegidas */}
          <Route
            path={ROUTES.LIBRARY}
            element={
              <RequireAccess>
                <Library />
              </RequireAccess>
            }
          />

          <Route
            path={ROUTES.PROFILE}
            element={
              <RequireAccess>
                <Dashboard />
              </RequireAccess>
            }
          />

          <Route
            path={ROUTES.SETTINGS}
            element={
              <RequireAccess>
                <Settings />
              </RequireAccess>
            }
          />

          <Route
            path={ROUTES.SHOP}
            element={
              <RequireAccess>
                <Shop />
              </RequireAccess>
            }
          />

          <Route
            path={ROUTES.INVENTORY}
            element={
              <RequireAccess>
                <Inventory />
              </RequireAccess>
            }
          />

        </Routes>
      </Layout>

      <ToastContainer />
    </BrowserRouter>
  )
}