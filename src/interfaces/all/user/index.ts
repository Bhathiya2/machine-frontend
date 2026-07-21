import type { EntityId, Timestamps } from '@/interfaces/base/common'

export interface User extends Timestamps {
  id: EntityId
  user_code?: string
  name: string
  email: string
  role?: string
  role_id?: number
  site?: string
  phone?: string | null
  permissions?: string[]
}

export interface CreateUserDto {
  name: string
  email: string
  password: string
  role_id: number
  site: string
  phone?: string
  user_code?: string
}

export type UpdateUserDto = Partial<CreateUserDto>
