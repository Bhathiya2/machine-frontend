import permissionApi from '@/api/permission/permissionApi'
import type { PermissionItem } from '@/interfaces/all/role'

function unwrap<T>(response: { data: T } | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data
  }
  return response as T
}

class PermissionService {
  async list(): Promise<PermissionItem[]> {
    const response = await permissionApi.list()
    const data = unwrap(response)
    return Array.isArray(data) ? data : []
  }
}

export const permissionService = new PermissionService()
export default permissionService
