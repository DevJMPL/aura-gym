import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { KioskLayout } from './layouts/KioskLayout'
import { useAuth } from '../contexts/AuthContext'
import { LoadingState } from '../components/ui'

import { LoginPage } from './pages/LoginPage'
import { SetupPage } from './pages/SetupPage'
import { useGym } from '../contexts/GymContext'

import { DashboardPage } from './pages/DashboardPage'

import { MembersListPage } from './pages/MembersListPage'
import { MemberFormPage } from './pages/MemberFormPage'
import { MemberDetailPage } from './pages/MemberDetailPage'

import { KioskPage } from './pages/KioskPage'
import { ProfilePage } from './pages/ProfilePage'
import { StaffPage } from './pages/StaffPage'

import { PlansPage } from './pages/PlansPage'

import { AttendanceLogPage } from './pages/AttendanceLogPage'

// Placeholder imports for pages
const ReportsPage = () => <div>Reports Page</div>
const SettingsPage = () => <div>Settings Page</div>

function ProtectedRoute({ children, requireSetup = true }: { children: React.ReactNode; requireSetup?: boolean }) {
  const { session, isLoading: authLoading } = useAuth()
  const { isConfigured, isLoading: gymLoading } = useGym()

  if (authLoading || (session && gymLoading)) {
    return <LoadingState fullScreen message="Cargando..." />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  // If user is authenticated but gym is not configured, force them to setup
  if (requireSetup && !isConfigured) {
    return <Navigate to="/setup" replace />
  }

  // If user is on setup but gym IS configured, send to dashboard
  if (!requireSetup && isConfigured) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { role } = useAuth()
  
  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Setup Route (Protected) */}
      <Route
        path="/setup"
        element={
          <ProtectedRoute requireSetup={false}>
            <SetupPage />
          </ProtectedRoute>
        }
      />

      {/* Main App Routes (Protected) */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/members" element={<MembersListPage />} />
        <Route path="/members/new" element={<MemberFormPage />} />
        <Route path="/members/:id" element={<MemberDetailPage />} />
        <Route path="/members/:id/edit" element={<MemberFormPage />} />
        <Route
          path="/plans"
          element={
            <AdminRoute>
              <PlansPage />
            </AdminRoute>
          }
        />
        <Route path="/attendance" element={<AttendanceLogPage />} />
        <Route
          path="/reports"
          element={
            <AdminRoute>
              <ReportsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <AdminRoute>
              <SettingsPage />
            </AdminRoute>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/staff"
          element={
            <AdminRoute>
              <StaffPage />
            </AdminRoute>
          }
        />

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Kiosk Routes (Protected) */}
      <Route
        element={
          <ProtectedRoute>
            <KioskLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/kiosk" element={<KioskPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
