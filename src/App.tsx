import { Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { RequireAdmin, RequireAuth } from './components/RouteGuards'
import Home from './pages/Home'
import Explore from './pages/Explore'
import ModDetail from './pages/ModDetail'
import UploadMod from './pages/UploadMod'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import Profile from './pages/Profile'
import AdminPanel from './pages/AdminPanel'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/mods/:slug" element={<ModDetail />} />
        <Route path="/users/:username" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/upload"
          element={
            <RequireAuth>
              <UploadMod />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminPanel />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}
