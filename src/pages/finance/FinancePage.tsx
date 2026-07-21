import { Receipt } from 'lucide-react'
import { useDashboardContext } from '@/pages/dashboard/context/DashboardContext'
import { PERMISSIONS } from '@/pages/dashboard/permissions'
import { usePermissions } from '@/hooks/permission/usePermissions'
import { Card } from '@/pages/dashboard/components/DashboardUI'
import { FinanceView } from './FinanceView'

export default function FinancePage() {
  const ctx = useDashboardContext()
  const { can } = usePermissions()
  const allowed = can(PERMISSIONS.FINANCE_VIEW)

  if (!allowed) {
    return (
      <Card className="flex h-64 flex-col items-center justify-center text-center">
        <Receipt size={36} className="mb-3 text-muted-foreground/40" />
        <p className="text-sm font-semibold text-foreground">Access Restricted</p>
        <p className="mt-1 text-xs text-muted-foreground">
          You do not have permission to view finance data.
        </p>
      </Card>
    )
  }

  return (
    <FinanceView
      repairRecords={ctx.repairRecords}
      workOrders={ctx.workOrders}
      machines={ctx.machines}
      users={ctx.users}
      currentUser={ctx.currentUser}
      onUpdateCosts={ctx.updateWorkOrderCosts}
    />
  )
}
