import type { AxiosResponse } from 'axios'
import axiosInstance from '@/libs/axios'
import { BaseApi } from '@/api/base/baseApi'
import type { WorkOrderApi, WorkOrderFilters } from '@/interfaces/all/workOrder'

class WorkOrderApi extends BaseApi {
  constructor() {
    super('/work-orders')
  }

  list<T = WorkOrderApi>(filters: WorkOrderFilters = {}): Promise<AxiosResponse<T[]>> {
    return axiosInstance.get<T[]>(this.resource, { params: filters })
  }
}

export const workOrderApi = new WorkOrderApi()
export default workOrderApi
