import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ToastContainer } from './components/toast/ToastContainer'
import { initAuthListener } from './services/googleAuth'
import { initDriveSync } from './services/driveSync'

// 🔐 inicia login automático
initAuthListener()

// ☁️ inicia sincronização Drive ↔ App
initDriveSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <ToastContainer />
  </StrictMode>
)
