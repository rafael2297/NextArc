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
        // 1. CARREGA OS DADOS DO DISCO (REHYDRATE)
        await Promise.all([
          useSessionStore.persist.rehydrate(),
          useProfileStore.persist.rehydrate()
        ]);

        const session = useSessionStore.getState();
        const profile = useProfileStore.getState();

        // 2. SE ESTIVER AUTENTICADO, REINICIA SERVIÇOS NA ORDEM CERTA
        if (session.isAuthenticated && profile.profile.accessToken) {
          initAuthListener();

          // A ORDEM AQUI É CRÍTICA:
          // Primeiro, tentamos puxar o que está na nuvem.
          // Só depois ativamos o "vigia" (initDriveSync) que salva alterações.
          try {
            await restoreFromDrive();
            console.log("[App]: Restore inicial concluído.");
          } catch (err) {
            console.error("Erro no sync inicial:", err);
          }

          // Agora que os dados já estão no Zustand, ativamos o auto-save
          initDriveSync();
        }

      } catch (e) {
        console.error("Erro na inicialização do App:", e);
      } finally {
        setIsLoaded(true);
      }
    };

    initApp();

    // 3. LISTENER DE CALLBACK DE AUTENTICAÇÃO (ELECTRON)
    // Corrigido para bater com a assinatura da função handleAuthSuccess
    // 3. LISTENER DE CALLBACK DE AUTENTICAÇÃO (ELECTRON)
    if ((window as any).electronAPI) {
      const unsubscribe = (window as any).electronAPI.onAuthCallback((url: string) => {
        try {
          console.log("[App]: Recebido Deep Link:", url);

          // 1. Removemos o protocolo e tratamos a string para garantir que o URL() entenda
          // Substituímos 'auth/' por 'auth' para evitar que a barra final quebre a busca
          const normalizedUrl = url.replace('nesxtarc://auth/', 'http://localhost/').replace('nesxtarc://auth', 'http://localhost/');
          const urlObj = new URL(normalizedUrl);

          // 2. Tenta pegar de todas as formas possíveis (token, access_token, no hash ou na query)
          const params = new URLSearchParams(urlObj.hash.substring(1) || urlObj.search);
          const accessToken = params.get('token') || params.get('access_token');

          if (accessToken) {
            console.log("[App]: Token extraído com sucesso!");
            handleAuthSuccess({ accessToken });
          } else {
            console.warn("[App]: URL recebida, mas nenhum token encontrado.", url);
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

  if (!isLoaded) {
    return <div className="h-screen w-screen bg-black" />;
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