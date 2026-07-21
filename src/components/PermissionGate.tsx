import type { ReactNode } from 'react'
import { usePermissions } from '@/hooks/permission/usePermissions'
import type { Permission } from '@/pages/dashboard/permissions'

interface PermissionGateProps {
  permission?: Permission
  permissions?: Permission[]
  mode?: 'any' | 'all'
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGate({
  permission,
  permissions = permission ? [permission] : [],
  mode = 'any',
  fallback = null,
  children,
}: PermissionGateProps) {
  const { can, canAll, canAny } = usePermissions()
  const allowed =
    permissions.length === 0
      ? true
      : mode === 'all'
        ? canAll(permissions)
        : canAny(permissions)

  return allowed ? children : fallback
}
