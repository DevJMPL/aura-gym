import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { KioskLayout } from './layouts/KioskLayout'
import { useAuth } from '../contexts/AuthContext'
import { LoadingState } from '../components/ui'
import { AccessDenied } from '../components/ui/AccessDenied'

import { LoginPage } from './pages/LoginPage'
import { SetupPage } from './pages/SetupPage'
import { useGym } from '../contexts/GymContext'

import { DashboardPage } from './pages/DashboardPage'

import { MembersListPage } from './pages/MembersListPage'
import { MemberFormPage } from './pages/MemberFormPage'
import { MemberDetailPage } from './pages/MemberDetailPage'

import { KioskPage } from './pages/KioskPage'

import { PlansPage } from './pages/PlansPage'
import { PosLayout } from '../features/pos/pages/PosLayout'
import { PosKioskPage } from '../features/pos/pages/PosKioskPage'
import { PosProductsPage } from '../features/pos/pages/PosProductsPage'
import { PosSalesPage } from '../features/pos/pages/PosSalesPage'
import { PosBalancesPage } from '../features/pos/pages/PosBalancesPage'

import { AttendanceLogPage } from './pages/AttendanceLogPage'

import { ReportsLayout } from '../features/reports/pages/ReportsLayout'
import { ReportsDashboardPage } from '../features/reports/pages/ReportsDashboardPage'
import { FinancialReportPage } from '../features/reports/pages/FinancialReportPage'
import { AttendanceReportPage } from '../features/reports/pages/AttendanceReportPage'
import { MembershipReportPage } from '../features/reports/pages/MembershipReportPage'
import { MembersReportPage } from '../features/reports/pages/MembersReportPage'

import { SettingsLayout } from '../features/settings/pages/SettingsLayout'
import { ProfilePage } from './pages/ProfilePage'
import { GymInfoTab } from '../features/settings/pages/GymInfoTab'
import { GeneralSettingsTab } from '../features/settings/pages/GeneralSettingsTab'
import { StaffPage } from './pages/StaffPage'
import { LoginHistoryTab } from '../features/settings/pages/LoginHistoryTab'
import { AuditLogsTab } from '../features/settings/pages/AuditLogsTab'
import { DeveloperInfoPage } from './pages/DeveloperInfoPage'

function ProtectedRoute({
  children,
  requireSetup = true,
}: {
  children: React.ReactNode
  requireSetup?: boolean
}) {
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
    return <AccessDenied />
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
        <Route path="/pos" element={<PosLayout />}>
          <Route index element={<Navigate to="kiosk" replace />} />
          <Route path="kiosk" element={<PosKioskPage />} />
          <Route path="products" element={<PosProductsPage />} />
          <Route path="sales" element={<PosSalesPage />} />
          <Route path="balances" element={<PosBalancesPage />} />
        </Route>
        <Route
          path="/reports"
          element={
            <AdminRoute>
              <ReportsLayout />
            </AdminRoute>
          }
        >
          <Route index element={<ReportsDashboardPage />} />
          <Route path="financial" element={<FinancialReportPage />} />
          <Route path="attendance" element={<AttendanceReportPage />} />
          <Route path="memberships" element={<MembershipReportPage />} />
          <Route path="members" element={<MembersReportPage />} />
        </Route>
        <Route
          path="/settings"
          element={
            <AdminRoute>
              <SettingsLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="gym" replace />} />
          <Route path="gym" element={<GymInfoTab />} />
          <Route path="general" element={<GeneralSettingsTab />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="login-history" element={<LoginHistoryTab />} />
          <Route path="audit" element={<AuditLogsTab />} />
        </Route>

        <Route path="/developer" element={<DeveloperInfoPage />} />

        <Route path="/profile" element={<ProfilePage />} />

        {/* Legacy routes redirect to settings */}
        <Route path="/staff" element={<Navigate to="/settings/staff" replace />} />

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
