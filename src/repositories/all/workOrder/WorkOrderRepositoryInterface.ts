import type { WorkOrderFilters } from '@/interfaces/all/workOrder'
import type { WorkOrder, WorkOrderStatus } from '@/pages/dashboard/types'
import type { WorkOrderFormData } from '@/pages/work-orders/workOrderMapper'

export interface WorkOrderRepositoryInterface {
  list(filters?: WorkOrderFilters): Promise<WorkOrder[]>
  create(form: WorkOrderFormData, createdBy: string): Promise<WorkOrder>
  update(dbId: number, form: WorkOrderFormData): Promise<WorkOrder>
  updateStatus(dbId: number, status: WorkOrderStatus): Promise<WorkOrder>
  updateNotes(dbId: number, notes: string): Promise<WorkOrder>
  updateCostEntries(dbId: number, entries: import('@/pages/dashboard/types').CostEntry[]): Promise<WorkOrder>
  delete(dbId: number): Promise<void>
  checkIn(dbId: number): Promise<WorkOrder>
  checkOut(dbId: number): Promise<WorkOrder>
}