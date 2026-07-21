import { useDashboardContext } from '@/pages/dashboard/context/DashboardContext'
import { NotificationsView } from './NotificationsView'

export default function NotificationsPage() {
  const ctx = useDashboardContext()
  return (
    <NotificationsView
      notifications={ctx.notifications}
      currentUser={ctx.currentUser}
      onNavigate={ctx.navigate}
      onMarkRead={ctx.markNotificationRead}
      onMarkAllRead={ctx.markAllNotificationsRead}
    />
  )
}
