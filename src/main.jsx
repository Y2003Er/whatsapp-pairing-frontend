import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './theme'
import ParticleBackground from './ParticleBackground.jsx'
import InitialLoader from './InitialLoader.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ParticleBackground />
      <App />
      <InitialLoader />
    </ThemeProvider>
  </StrictMode>,
)
