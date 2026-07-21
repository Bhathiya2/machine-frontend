import { Navigate, useLocation } from 'react-router'
import { usePermissions } from '@/hooks/permission/usePermissions'
import { ROUTE_PERMISSIONS } from '@/pages/dashboard/permissions'
import { viewFromPath } from '@/pages/dashboard/constants'
import type { ReactNode } from 'react'

export default function RoleRoute({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { can } = usePermissions()
  const view = viewFromPath(location.pathname)
  const required = ROUTE_PERMISSIONS[view]

  if (required && !can(required)) {
    return <Navigate to="/dashboard" replace state={{ from: location.pathname }} />
  }

  return children
}
