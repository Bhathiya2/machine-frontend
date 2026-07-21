import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import DashboardLayout from '@/pages/dashboard/layout/DashboardLayout'
import DashboardPage from '@/pages/home/DashboardPage'
import MachinesPage from '@/pages/machines/MachinesPage'
import WorkOrdersPage from '@/pages/work-orders/WorkOrdersPage'
import FaultReportsPage from '@/pages/fault-reports/FaultReportsPage'
import RepairRecordsPage from '@/pages/repair-records/RepairRecordsPage'
import AnalyticsPage from '@/pages/analytics/AnalyticsPage'
import FinancePage from '@/pages/finance/FinancePage'
import NotificationsPage from '@/pages/notifications/NotificationsPage'
import UsersPage from '@/pages/users/UsersPage'
import RolesPage from '@/pages/roles/RolesPage'
import LoginPage from '@/pages/auth/LoginPage'
import GuestRoute from '@/route/GuestRoute'
import ProtectedRoute from '@/route/ProtectedRoute'
import RoleRoute from '@/route/RoleRoute'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <RoleRoute>
                <DashboardLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/machines" element={<MachinesPage />} />
          <Route path="/work-orders" element={<WorkOrdersPage />} />
          <Route path="/fault-reports" element={<FaultReportsPage />} />
          <Route path="/repair-records" element={<RepairRecordsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/roles" element={<RolesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
