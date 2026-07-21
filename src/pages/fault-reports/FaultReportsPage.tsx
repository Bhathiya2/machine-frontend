import { useDashboardContext, useFocusId } from '@/pages/dashboard/context/DashboardContext'
import { FaultReportsView } from './FaultReportsView'

export default function FaultReportsPage() {
  const ctx = useDashboardContext()
  const focusId = useFocusId()
  return (
    <FaultReportsView
      faultReports={ctx.faultReports}
      machines={ctx.machines}
      users={ctx.users}
      onNavigate={ctx.navigate}
      focusId={focusId}
      onDismiss={ctx.dismissFaultReport}
      onConvert={ctx.convertFaultToWorkOrder}
      onCreate={ctx.createFaultReport}
    />
  )
}
