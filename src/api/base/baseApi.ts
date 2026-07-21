import type { AxiosResponse } from 'axios'
import axiosInstance from '@/libs/axios'
import type { EntityId, PaginatedResponse } from '@/interfaces/base/common'

/**
 * Raw HTTP CRUD — mirrors backend BaseRepository endpoints.
 * Entity folders extend this with a resource path (e.g. `/machines`).
 */
export class BaseApi {
  constructor(protected readonly resource: string) {}

  all<T>(): Promise<AxiosResponse<T[]>> {
    return axiosInstance.get<T[]>(this.resource)
  }

  paginate<T>(page = 1, perPage = 15): Promise<AxiosResponse<PaginatedResponse<T>>> {
    return axiosInstance.get<PaginatedResponse<T>>(this.resource, {
      params: { page, per_page: perPage },
    })
  }

  find<T>(id: EntityId): Promise<AxiosResponse<T>> {
    return axiosInstance.get<T>(`${this.resource}/${id}`)
  }

  create<T, D = Partial<T>>(data: D): Promise<AxiosResponse<T>> {
    return axiosInstance.post<T>(this.resource, data)
  }

  update<T, D = Partial<T>>(id: EntityId, data: D): Promise<AxiosResponse<T>> {
    return axiosInstance.put<T>(`${this.resource}/${id}`, data)
  }

  delete(id: EntityId): Promise<AxiosResponse<void>> {
    return axiosInstance.delete(`${this.resource}/${id}`)
  }
}

export default BaseApi
