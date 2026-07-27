import { useCallback, useMemo } from 'react'
import { useAuthContext } from '@/context/AuthContext'
import { usePermission } from '@/hooks/base/commonHooks'
import { ROLE_PERMISSIONS, type Permission } from '@/pages/dashboard/permissions'
import { authUserToAppUser } from '@/utils/authUserMapper'
import type { AppUser, WorkOrder, WorkOrderStatus } from '@/pages/dashboard/types'
import { canTransitionTo, isWoFinal } from '@/pages/work-orders/workOrderFlow'

export function usePermissions() {
  const { user } = useAuthContext()
  const currentUser = useMemo<AppUser | null>(() => (user ? authUserToAppUser(user) : null), [user])

  const permissionUser = useMemo(() => {
    if (!currentUser) return null
    if (user?.permissions?.length) {
      return { role: currentUser.role, permissions: user.permissions }
    }
    return { role: currentUser.role }
  }, [currentUser, user?.permissions])

  const { can: baseCan, hasRole, canAll: baseCanAll, canAny: baseCanAny } = usePermission(
    permissionUser,
    ROLE_PERMISSIONS
  )

  const isSuperAdmin = currentUser?.role === 'Super Admin'

  const can = useCallback(
    (permission: Permission) => {
      if (isSuperAdmin) return true
      if (user?.permissions?.length) {
        return user.permissions.includes(permission)
      }
      return baseCan(permission)
    },
    [isSuperAdmin, user?.permissions, baseCan]
  )

  const canAll = useCallback(
    (permissions: Permission[]) => {
      if (isSuperAdmin) return true
      return permissions.every((p) => can(p))
    },
    [isSuperAdmin, can]
  )

  const canAny = useCallback(
    (permissions: Permission[]) => {
      if (isSuperAdmin) return true
      return permissions.some((p) => can(p))
    },
    [isSuperAdmin, can]
  )

  const canUpdateWorkOrderStatus = useCallback(
    (order: WorkOrder, nextStatus?: string) => {
      if (!currentUser) return false

      const target = nextStatus as WorkOrderStatus | undefined

      if (!target) {
        if (isSuperAdmin) return !isWoFinal(order.status)
        if (can('workorders.update')) return !isWoFinal(order.status)
        if (can('workorders.verify_close') && order.status === 'Verified') return true
        if (can('workorders.cancel') && !isWoFinal(order.status)) return true
        if (can('workorders.update_status') && order.assignedTo === currentUser.id) {
          return !isWoFinal(order.status)
        }
        return false
      }

      if (!canTransitionTo(order.status, target)) return false

      if (isSuperAdmin) return true

      if (target === 'Finished' && order.status === 'Verified') {
        return hasRole('Finance')
      }

      if (target === 'Verified') {
        return can('workorders.verify_close') || (order.assignedTo === currentUser.id && can('workorders.update_status'))
      }

      if (target === 'Close') {
        return can('workorders.cancel')
      }

      if (target === 'Inprogress' && order.status === 'Close') {
        return can('workorders.update')
      }

      if (can('workorders.update')) return true
      if (!can('workorders.update_status')) return false
      if (order.assignedTo !== currentUser.id) return false

      return true
    },
    [can, hasRole, currentUser, isSuperAdmin]
  )

  const canUpdateWorkOrderNotes = useCallback(
    (order: WorkOrder) => {
      if (!currentUser) return false
      if (isSuperAdmin) return true
      if (can('workorders.update')) return true
      return can('workorders.update_notes') && order.assignedTo === currentUser.id
    },
    [can, currentUser, isSuperAdmin]
  )

  return {
    currentUser,
    can,
    hasRole,
    canAll,
    canAny,
    canUpdateWorkOrderStatus,
    canUpdateWorkOrderNotes,
  }
}
