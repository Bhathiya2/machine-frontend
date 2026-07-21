import { useDashboardContext } from '@/pages/dashboard/context/DashboardContext'
import { DashboardView } from './DashboardView'

export default function DashboardPage() {
  const ctx = useDashboardContext()
  return (
    <DashboardView
      machines={ctx.machines}
      workOrders={ctx.workOrders}
      repairRecords={ctx.repairRecords}
      faultReports={ctx.faultReports}
      onNavigate={ctx.navigate}
    />
  )
}
