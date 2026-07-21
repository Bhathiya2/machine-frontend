import { useDashboardContext, useFocusId } from '@/pages/dashboard/context/DashboardContext'
import { RepairRecordsView } from './RepairRecordsView'

export default function RepairRecordsPage() {
  const ctx = useDashboardContext()
  const focusId = useFocusId()
  return (
    <RepairRecordsView
      repairRecords={ctx.repairRecords}
      machines={ctx.machines}
      users={ctx.users}
      workOrders={ctx.workOrders}
      focusId={focusId}
      onCreate={ctx.createRepairRecord}
    />
  )
}
