import { useDashboardContext } from '@/pages/dashboard/context/DashboardContext'
import { AnalyticsView } from './AnalyticsView'

export default function AnalyticsPage() {
  const ctx = useDashboardContext()
  return <AnalyticsView repairRecords={ctx.repairRecords} machines={ctx.machines} />
}
