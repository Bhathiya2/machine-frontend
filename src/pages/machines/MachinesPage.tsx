import { useDashboardContext, useFocusId } from '@/pages/dashboard/context/DashboardContext'
import { MachineRegistryView } from './MachineRegistryView'

export default function MachinesPage() {
  const ctx = useDashboardContext()
  const focusId = useFocusId()

  return (
    <MachineRegistryView
      machines={ctx.machines}
      loading={ctx.machinesLoading}
      saving={ctx.machinesSaving}
      onRefresh={ctx.loadMachines}
      onCreate={ctx.createMachine}
      onUpdate={ctx.updateMachine}
      onDelete={ctx.deleteMachine}
      workOrders={ctx.workOrders}
      repairRecords={ctx.repairRecords}
      faultReports={ctx.faultReports}
      onCreateFaultReport={ctx.createFaultReport}
      focusId={focusId}
      onNavigate={ctx.navigate}
      currentUser={ctx.currentUser}
    />
  )
}
