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

  checkIn<T = WorkOrderApi>(id: number): Promise<AxiosResponse<T>> {
    return axiosInstance.post<T>(`${this.resource}/${id}/check-in`)
  }

  checkOut<T = WorkOrderApi>(id: number): Promise<AxiosResponse<T>> {
    return axiosInstance.post<T>(`${this.resource}/${id}/check-out`)
  }
}

export const workOrderApi = new WorkOrderApi()
export default workOrderApi