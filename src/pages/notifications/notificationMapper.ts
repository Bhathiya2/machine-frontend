import type { NotificationApi } from '@/interfaces/all/notification'
import type { Notification } from '@/pages/dashboard/types'

function formatDate(value: string): string {
  return value.includes('T') ? value.split('T')[0] : value
}

export function apiNotificationToUi(api: NotificationApi): Notification {
  return {
    dbId: Number(api.id),
    id: api.notification_code,
    userId: api.user_code,
    message: api.message,
    read: api.read,
    workOrderId: api.work_order_number ?? '',
    createdAt: formatDate(String(api.created_at)),
  }
}
