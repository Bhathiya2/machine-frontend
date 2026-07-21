import notificationApi from '@/api/notification/notificationApi'
import type { NotificationApi } from '@/interfaces/all/notification'

function unwrap<T>(response: { data: T } | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data
  }
  return response as T
}

class NotificationService {
  async all(): Promise<NotificationApi[]> {
    const response = await notificationApi.all<NotificationApi>()
    const data = unwrap(response)
    return Array.isArray(data) ? data : []
  }

  async markRead(id: number): Promise<NotificationApi> {
    const response = await notificationApi.markRead(id)
    return unwrap(response)
  }

  async markAllRead(): Promise<void> {
    await notificationApi.markAllRead()
  }
}

export const notificationService = new NotificationService()
export default notificationService
