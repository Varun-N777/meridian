import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from './store/authStore'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminLayout from './layouts/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import Customer360 from './pages/admin/Customer360'
import ChurnCenter from './pages/admin/ChurnCenter'
import TrustCenter from './pages/admin/TrustCenter'
import NBACenter from './pages/admin/NBACenter'
import CampaignBuilder from './pages/admin/CampaignBuilder'
import ROICenter from './pages/admin/ROICenter'
import ExecutiveSummary from './pages/admin/ExecutiveSummary'
import DigitalTwin from './pages/admin/DigitalTwin'
import Observability from './pages/admin/Observability'
import MeridianDashboard from './pages/admin/MeridianDashboard'
import CustomerPortal from './pages/shop/CustomerPortal'

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" />
  if (role && user?.role !== role) return <Navigate to="/" />
  return <>{children}</>
}

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Customer Portal */}
        <Route path="/shop/*" element={
          <ProtectedRoute>
            <CustomerPortal />
          </ProtectedRoute>
        } />
        
        {/* Admin Mission Control */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="customer360" element={<Customer360 />} />
          <Route path="churn" element={<ChurnCenter />} />
          <Route path="trust" element={<TrustCenter />} />
          <Route path="nba" element={<NBACenter />} />
          <Route path="campaigns" element={<CampaignBuilder />} />
          <Route path="roi" element={<ROICenter />} />
          <Route path="executive-summary" element={<ExecutiveSummary />} />
          <Route path="digital-twin" element={<DigitalTwin />} />
          <Route path="meridian-ipc" element={<MeridianDashboard />} />
          <Route path="observability" element={<Observability />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}
