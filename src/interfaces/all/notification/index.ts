import type { EntityId, Timestamps } from '@/interfaces/base/common'

export interface NotificationApi extends Timestamps {
  id: EntityId
  notification_code: string
  user_code: string
  message: string
  read: boolean
  work_order_number?: string | null
}
