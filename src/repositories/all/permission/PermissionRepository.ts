import permissionService from '@/services/all/permission/PermissionService'
import type { PermissionItem } from '@/interfaces/all/role'
import type { PermissionRepositoryInterface } from './PermissionRepositoryInterface'

class PermissionRepository implements PermissionRepositoryInterface {
  async getAll(): Promise<PermissionItem[]> {
    return permissionService.list()
  }
}

export const permissionRepository = new PermissionRepository()
export default permissionRepository
