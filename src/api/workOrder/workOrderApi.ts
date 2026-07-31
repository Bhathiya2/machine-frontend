import type { AxiosResponse } from 'axios'
import axiosInstance from '@/libs/axios'
import { BaseApi } from '@/api/base/baseApi'
import type { WorkOrderApi, WorkOrderFilters } from '@/interfaces/all/workOrder'
import type { WorkOrderCheckInSession } from '@/pages/dashboard/types'

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

  addTechnicianNotes<T = WorkOrderApi>(id: number, notes: string): Promise<AxiosResponse<T>> {
    return axiosInstance.post<T>(`${this.resource}/${id}/notes`, { notes })
  }

  getCheckInSessions<T = WorkOrderCheckInSession[]>(workOrderId: number): Promise<AxiosResponse<T>> {
    return axiosInstance.get<T>(`${this.resource}/${workOrderId}/check-in-sessions`);
  }
}

export const workOrderApi = new WorkOrderApi()
export default workOrderApi