import axiosInstance from '@/libs/axios'
import { BaseApi } from '@/api/base/baseApi'
import type { NotificationApi } from '@/interfaces/all/notification'

class NotificationApiClient extends BaseApi {
  constructor() {
    super('/notifications')
  }

  markRead(id: number) {
    return axiosInstance.post<NotificationApi>(`${this.resource}/${id}/read`)
  }

  markAllRead() {
    return axiosInstance.post<{ message: string }>(`${this.resource}/mark-all-read`)
  }
}

export const notificationApi = new NotificationApiClient()
export default notificationApi
