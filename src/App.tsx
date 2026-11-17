import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './components/AppLayout'
import { ToastProvider } from './components/Toaster'
import { ApplicationPanel } from './pages/ApplicationPanel'
import { AuthPage } from './pages/AuthPage'
import { BoardPage } from './pages/BoardPage'
import { CvPage } from './pages/CvPage'
import { NewApplicationPage } from './pages/NewApplicationPage'
import { ProfilePage } from './pages/ProfilePage'
import { StatsPage } from './pages/StatsPage'

/**
 * The page map. Everything inside <RequireAuth> needs a signed-in user;
 * the board's child routes open on top of the board (a form or a card).
 */
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<AuthPage mode="signin" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route element={<RequireAuth />}>
              <Route path="/" element={<BoardPage />}>
                <Route path="new" element={<NewApplicationPage />} />
                <Route path="applications/:id" element={<ApplicationPanel />} />
              </Route>
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/cv" element={<CvPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
