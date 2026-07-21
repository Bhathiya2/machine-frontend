import type { CreateUserDto, UpdateUserDto, User } from '@/interfaces/all/user'
import type { AppUser, UserRole } from '@/pages/dashboard/types'
import { normalizeRole } from '@/utils/authUserMapper'

export type UserFormData = {
  name: string
  email: string
  password: string
  roleId: number
  site: string
  phone: string
}

export function apiUserToAppUser(api: User): AppUser {
  return {
    dbId: Number(api.id),
    id: api.user_code ?? `u${api.id}`,
    name: api.name,
    email: api.email,
    role: normalizeRole(api.role) as UserRole,
    roleId: api.role_id,
    site: api.site ?? 'All Sites',
    phone: api.phone ?? undefined,
  }
}

export function formToCreateDto(form: UserFormData): CreateUserDto {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    password: form.password,
    role_id: form.roleId,
    site: form.site,
    phone: form.phone.trim() || undefined,
  }
}

export function formToUpdateDto(form: UserFormData): UpdateUserDto {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    role_id: form.roleId,
    site: form.site,
    phone: form.phone.trim() || undefined,
    ...(form.password ? { password: form.password } : {}),
  }
}
