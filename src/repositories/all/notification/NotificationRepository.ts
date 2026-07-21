import notificationService from '@/services/all/notification/NotificationService'
import { apiNotificationToUi } from '@/pages/notifications/notificationMapper'
import type { Notification } from '@/pages/dashboard/types'

class NotificationRepository {
  async getAll(): Promise<Notification[]> {
    const data = await notificationService.all()
    return data.map(apiNotificationToUi)
  }

  async markRead(dbId: number): Promise<Notification> {
    const updated = await notificationService.markRead(dbId)
    return apiNotificationToUi(updated)
  }

  async markAllRead(): Promise<void> {
    await notificationService.markAllRead()
  }
}

export const notificationRepository = new NotificationRepository()
export default notificationRepository
