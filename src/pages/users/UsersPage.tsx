import { useDashboardContext, useFocusId } from '@/pages/dashboard/context/DashboardContext'
import { UserManagementView } from './UserManagementView'

export default function UsersPage() {
  const ctx = useDashboardContext()
  const focusId = useFocusId()

  return (
    <UserManagementView
      currentUser={ctx.currentUser}
      workOrders={ctx.workOrders}
      focusId={focusId}
    />
  )
}
