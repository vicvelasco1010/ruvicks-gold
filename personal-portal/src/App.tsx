import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DashboardLayout } from './layouts/DashboardLayout'
import { Home } from './pages/Home'
import { LoginPage } from './pages/LoginPage'
import { MatchTrackerPage } from './pages/MatchTrackerPage'
import { NewsPage } from './pages/NewsPage'
import { NotesPage } from './pages/NotesPage'
import { ServicePage } from './pages/ServicePage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Home />} />
            <Route path="match" element={<MatchTrackerPage />} />
            <Route path="plex" element={<ServicePage serviceId="plex" />} />
            <Route path="seer" element={<ServicePage serviceId="seer" />} />
            <Route path="immich" element={<ServicePage serviceId="immich" />} />
            <Route path="stash" element={<ServicePage serviceId="stash" />} />
            <Route path="news" element={<NewsPage />} />
            <Route path="notes" element={<NotesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
