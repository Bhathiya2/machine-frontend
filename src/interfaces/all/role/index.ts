import type { EntityId, Timestamps } from '@/interfaces/base/common'

export interface PermissionItem extends Timestamps {
  id: EntityId
  name: string
  group: string
  label: string
}

export interface RoleItem extends Timestamps {
  id: EntityId
  name: string
  slug: string
  description: string | null
  is_system: boolean
  is_super_admin: boolean
  users_count?: number
  permissions: PermissionItem[]
}

export type CreateRoleDto = {
  name: string
  description?: string
  permission_ids?: number[]
}

export type UpdateRoleDto = Partial<CreateRoleDto>

export type SyncRolePermissionsDto = {
  permission_ids: number[]
}
