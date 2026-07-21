import type { PermissionItem } from '@/interfaces/all/role'

export interface PermissionRepositoryInterface {
  getAll(): Promise<PermissionItem[]>
}
