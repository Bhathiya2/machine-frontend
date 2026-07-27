import workOrderService from '@/services/all/workOrder/WorkOrderService'
import type { WorkOrderFilters } from '@/interfaces/all/workOrder'
import {
  apiWorkOrderToUi,
  costEntriesPatchDto,
  formToCreateDto,
  formToUpdateDto,
  notesPatchDto,
  statusPatchDto,
  type WorkOrderFormData,
} from '@/pages/work-orders/workOrderMapper'
import type { CostEntry, WorkOrder, WorkOrderStatus } from '@/pages/dashboard/types'
import type { WorkOrderRepositoryInterface } from './WorkOrderRepositoryInterface'

class WorkOrderRepository implements WorkOrderRepositoryInterface {
  async list(filters: WorkOrderFilters = {}): Promise<WorkOrder[]> {
    const data = await workOrderService.list(filters)
    return data.map(apiWorkOrderToUi)
  }

  async create(form: WorkOrderFormData, createdBy: string): Promise<WorkOrder> {
    const created = await workOrderService.create(formToCreateDto(form, createdBy))
    return apiWorkOrderToUi(created)
  }

  async update(dbId: number, form: WorkOrderFormData): Promise<WorkOrder> {
    const updated = await workOrderService.update(dbId, formToUpdateDto(form))
    return apiWorkOrderToUi(updated)
  }

  async updateStatus(dbId: number, status: WorkOrderStatus): Promise<WorkOrder> {
    const updated = await workOrderService.update(dbId, statusPatchDto(status))
    return apiWorkOrderToUi(updated)
  }

  async updateNotes(dbId: number, notes: string): Promise<WorkOrder> {
    const updated = await workOrderService.update(dbId, notesPatchDto(notes))
    return apiWorkOrderToUi(updated)
  }

  async updateCostEntries(dbId: number, entries: CostEntry[]): Promise<WorkOrder> {
    const updated = await workOrderService.update(dbId, costEntriesPatchDto(entries))
    return apiWorkOrderToUi(updated)
  }

  async delete(dbId: number): Promise<void> {
    await workOrderService.delete(dbId)
  }

  async checkIn(dbId: number): Promise<WorkOrder> {
    const updated = await workOrderService.checkIn(dbId)
    return apiWorkOrderToUi(updated)
  }

  async checkOut(dbId: number): Promise<WorkOrder> {
    const updated = await workOrderService.checkOut(dbId)
    return apiWorkOrderToUi(updated)
  }
}

export const workOrderRepository = new WorkOrderRepository()
export default workOrderRepository