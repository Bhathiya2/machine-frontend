import { BaseService } from '@/services/base/BaseService'
import workOrderApi from '@/api/workOrder/workOrderApi'
import type {
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  WorkOrderApi,
  WorkOrderFilters,
} from '@/interfaces/all/workOrder'

function unwrap<T>(response: { data: T } | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data
  }
  return response as T
}

class WorkOrderService extends BaseService<WorkOrderApi, CreateWorkOrderDto, UpdateWorkOrderDto> {
  constructor() {
    super(workOrderApi)
  }

  async list(filters: WorkOrderFilters = {}): Promise<WorkOrderApi[]> {
    const response = await workOrderApi.list(filters)
    const data = unwrap(response)
    return Array.isArray(data) ? data : []
  }

  async checkIn(id: number): Promise<WorkOrderApi> {
    const response = await workOrderApi.checkIn(id)
    return unwrap(response)
  }

  async checkOut(id: number): Promise<WorkOrderApi> {
    const response = await workOrderApi.checkOut(id)
    return unwrap(response)
  }
}

export const workOrderService = new WorkOrderService()
export default workOrderService