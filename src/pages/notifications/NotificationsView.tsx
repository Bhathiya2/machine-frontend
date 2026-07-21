import { Bell } from 'lucide-react'
import { TablePaginationBar, useTablePagination } from '@/components/TablePagination'
import { Card } from '@/pages/dashboard/components/DashboardUI'
import { formatDate } from '@/pages/dashboard/utils/formatters'
import type { AppUser, Notification } from '@/pages/dashboard/types'

export function NotificationsView({
  notifications,
  currentUser,
  onNavigate,
  onMarkRead,
  onMarkAllRead,
}: {
  notifications: Notification[]
  currentUser: AppUser
  onNavigate: (view: string, id?: string) => void
  onMarkRead: (dbId: number) => Promise<boolean>
  onMarkAllRead: () => Promise<boolean>
}) {
  const mine = notifications.filter((n) => n.userId === currentUser.id)
  const pagination = useTablePagination(mine, { pageSize: 5 })
  const { pageItems } = pagination

  const markRead = async (n: Notification) => {
    if (n.read) return
    if (n.dbId) await onMarkRead(n.dbId)
  }

  const markAllRead = async () => {
    await onMarkAllRead()
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{mine.filter((n) => !n.read).length} unread</p>
        {mine.some((n) => !n.read) && (
          <button onClick={markAllRead} className="text-xs font-mono text-foreground hover:text-foreground transition-colors">
            Mark all as read
          </button>
        )}
      </div>
      {mine.length === 0 ? (
        <Card className="flex flex-col items-center justify-center h-48 text-center">
          <Bell size={32} className="text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No notifications for this account</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="space-y-2 p-2">
            {pageItems.map((n) => (
              <div
                key={n.id}
                className={`cursor-pointer rounded-lg border p-4 transition-all ${n.read ? 'border-border bg-card' : 'border-border bg-muted'}`}
                onClick={() => {
                  void markRead(n)
                  onNavigate('workorders', n.workOrderId)
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-2 size-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-foreground'}`} />
                  <div className="flex-1">
                    <p className={`text-sm ${n.read ? 'text-muted-foreground' : 'font-medium text-foreground'}`}>{n.message}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="font-mono text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
                      <span className="font-mono text-xs text-foreground">View work order →</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <TablePaginationBar
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            pageNumbers={pagination.pageNumbers}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
            label="notification(s)"
          />
        </Card>
      )}
    </div>
  )
}
