import { useEffect, useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'

import Layout from './components/layout/Layout'
import { ToastContainer } from './components/toast/ToastContainer'
import ThemeHandler from './components/ThemeHandler'

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
import RequireAccess from './components/RequireAccess'
import { ROUTES } from './routes/paths'

import { initAuthListener, handleAuthSuccess } from './services/googleAuth'
import { initDriveSync, restoreFromDrive } from './services/driveSync'
import { useProfileStore } from './store/useProfileStore'
import { useSessionStore } from './store/useSessionStore'

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        // 1. CARREGA OS DADOS DO DISCO (HIDRATAÇÃO MANUAL)
        // Isso garante que Nome, Foto e Sessão sejam lidos antes de mostrar as rotas
        await Promise.all([
            useSessionStore.persist.rehydrate(),
            useProfileStore.persist.rehydrate()
        ]);

        const session = useSessionStore.getState();
        const profile = useProfileStore.getState();

        // 2. SE ESTIVER AUTENTICADO, REINICIA SERVIÇOS DE NUVEM
        if (session.hasAccess && profile.profile.accessToken) {
            initAuthListener();
            initDriveSync();
            // Tenta restaurar backup silenciosamente
            restoreFromDrive().catch(err => console.error("Erro no sync inicial:", err));
        }

      } catch (e) {
        console.error("Erro na inicialização do App:", e);
      } finally {
        // 3. LIBERA A RENDERIZAÇÃO
        setIsLoaded(true);
      }
    };

    initApp();

    // LISTENER DE CALLBACK DE AUTENTICAÇÃO (ELECTRON)
    if ((window as any).electronAPI) {
      const unsubscribe = (window as any).electronAPI.onAuthCallback((url: string) => {
        try {
          const cleanUrl = url.replace('nesxtarc://auth', 'http://localhost');
          const urlParams = new URL(cleanUrl);
          const accessToken = urlParams.searchParams.get('token');

          if (accessToken) {
            handleAuthSuccess({ user: {}, credential: { accessToken } });
          }
        } catch (error) {
          console.error("Erro ao processar callback de autenticação:", error);
        }
      });

      return () => {
        if (typeof unsubscribe === 'function') unsubscribe();
      };
    }
  }, []);

  // Enquanto carrega (milissegundos), mantém tela preta para evitar redirecionamento falso
  if (!isLoaded) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Loader opcional aqui */}
      </div>
    );
  }

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

            {/* Rotas Protegidas que usam RequireAccess */}
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