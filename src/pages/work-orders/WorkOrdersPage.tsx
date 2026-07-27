import { useDashboardContext, useFocusId } from '@/pages/dashboard/context/DashboardContext'
import { WorkOrdersView } from './WorkOrdersView'

export default function WorkOrdersPage() {
  const ctx = useDashboardContext()
  const focusId = useFocusId()

  return (
    <WorkOrdersView
      workOrders={ctx.workOrders}
      loading={ctx.workOrdersLoading}
      saving={ctx.workOrdersSaving}
      onRefresh={ctx.loadWorkOrders}
      onCreate={ctx.createWorkOrder}
      onUpdate={ctx.updateWorkOrder}
      onUpdateStatus={ctx.updateWorkOrderStatus}
      onUpdateNotes={ctx.updateWorkOrderNotes}
      onDelete={ctx.deleteWorkOrder}
      onCheckIn={ctx.checkInWorkOrder}
      onCheckOut={ctx.checkOutWorkOrder}
      machines={ctx.machines}
      users={ctx.users}
      currentUser={ctx.currentUser}
      focusId={focusId}
      faultReports={ctx.faultReports}
      onRefreshNotifications={ctx.loadNotifications}
    />
  )
}