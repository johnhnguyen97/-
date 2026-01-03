import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import { router } from './routes'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { WordNotesProvider } from './contexts/WordNotesContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <FavoritesProvider>
          <WordNotesProvider>
            <RouterProvider router={router} />
            <SpeedInsights />
            <Analytics />
          </WordNotesProvider>
        </FavoritesProvider>
      </ThemeProvider>
    </AuthProvider>
  </StrictMode>,
)
