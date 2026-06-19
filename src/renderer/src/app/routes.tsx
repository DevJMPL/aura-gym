import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { AuthLayout } from './layouts/AuthLayout'
import { KioskLayout } from './layouts/KioskLayout'
import { useAuth } from '../contexts/AuthContext'
import { LoadingState } from '../components/ui'
import { AccessDenied } from '../components/ui/AccessDenied'

import { LoginPage } from './pages/LoginPage'
import { SetupPage } from './pages/SetupPage'
import { SelectGymPage } from './pages/SelectGymPage'
import { useGym } from '../contexts/GymContext'
import { useTenant } from '../contexts/TenantContext'

import { DashboardPage } from './pages/DashboardPage'

import { MembersListPage } from './pages/MembersListPage'
import { MemberFormPage } from './pages/MemberFormPage'
import { MemberDetailPage } from './pages/MemberDetailPage'

import { KioskPage } from './pages/KioskPage'

import { PlansPage } from './pages/PlansPage'

import { AttendanceLogPage } from './pages/AttendanceLogPage'

import { FinancesPage } from './pages/FinancesPage'

import { ReportsLayout } from '../features/reports/pages/ReportsLayout'
import { ReportsDashboardPage } from '../features/reports/pages/ReportsDashboardPage'
import { FinancialReportPage } from '../features/reports/pages/FinancialReportPage'
import { AttendanceReportPage } from '../features/reports/pages/AttendanceReportPage'
import { MembershipReportPage } from '../features/reports/pages/MembershipReportPage'
import { MembersReportPage } from '../features/reports/pages/MembersReportPage'

import { POSPage } from '../features/pos/pages/POSPage'
import { InventoryLayout } from '../features/pos/pages/InventoryLayout'
import { ProductsTab } from '../features/pos/pages/ProductsTab'
import { CategoriesTab } from '../features/pos/pages/CategoriesTab'
import { MovementsTab } from '../features/pos/pages/MovementsTab'
import { SalesTab } from '../features/pos/pages/SalesTab'

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
  allowSelectGym = false,
}: {
  children: React.ReactNode
  requireSetup?: boolean
  allowSelectGym?: boolean
}) {
  const { session, isLoading: authLoading } = useAuth()
  const { activeTenantId, isLoadingTenants } = useTenant()
  const { isConfigured, isLoading: gymLoading } = useGym()

  if (authLoading || (session && isLoadingTenants) || (session && activeTenantId && gymLoading)) {
    return <LoadingState fullScreen message="Cargando..." />
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Select-gym page is always accessible when logged in (even with an active tenant)
  if (allowSelectGym) {
    return <>{children}</>
  }

  // If user is authenticated but needs to select or create a gym
  if (requireSetup && !activeTenantId) {
    return <Navigate to="/select-gym" replace />
  }

  // If user is authenticated and selected a gym, but it's not configured yet
  if (requireSetup && activeTenantId && !isConfigured) {
    // We can assume SetupPage sets up the gym for the first time
    // If it's a new tenant it should be configured by default, but just in case
    return <Navigate to="/setup" replace />
  }

  // If user is on the setup page but HAS already selected a configured gym, send to dashboard
  // Note: we DO NOT redirect from /select-gym here — that page is always accessible
  if (!requireSetup && activeTenantId && isConfigured) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { currentTenantRole } = useTenant()

  if (currentTenantRole !== 'admin') {
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

      {/* Setup Route (Protected - also accessible when user wants to add a new gym) */}
      <Route
        path="/setup"
        element={
          <ProtectedRoute requireSetup={false} allowSelectGym>
            <SetupPage />
          </ProtectedRoute>
        }
      />

      {/* Select Gym Route (Protected - always accessible when logged in) */}
      <Route
        path="/select-gym"
        element={
          <ProtectedRoute requireSetup={false} allowSelectGym>
            <SelectGymPage />
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
          path="/finances"
          element={
            <AdminRoute>
              <FinancesPage />
            </AdminRoute>
          }
        />
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

        <Route path="/pos" element={<POSPage />} />

        <Route
          path="/inventory"
          element={
            <AdminRoute>
              <InventoryLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="products" replace />} />
          <Route path="products" element={<ProductsTab />} />
          <Route path="categories" element={<CategoriesTab />} />
          <Route path="movements" element={<MovementsTab />} />
          <Route path="sales" element={<SalesTab />} />
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
