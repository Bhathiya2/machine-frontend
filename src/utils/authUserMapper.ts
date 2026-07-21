import type { User } from '@/interfaces/all/user'
import type { AppUser, UserRole } from '@/pages/dashboard/types'

const VALID_ROLES: UserRole[] = ['Super Admin', 'Manager', 'Technician', 'Owner', 'Worker', 'Finance']

const SUPER_ADMIN_EMAILS = ['superadmin@example.com', 'admin@example.com']

export function isSuperAdminRole(role?: string | null): boolean {
  if (!role) return false
  const normalized = role.trim().toLowerCase()
  return normalized === 'super admin' || normalized === 'superadmin' || normalized === 'admin'
}

export function normalizeRole(role?: string | null, email?: string | null): UserRole {
  if (email && SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase())) {
    return 'Super Admin'
  }
  if (isSuperAdminRole(role)) return 'Super Admin'
  if (role && VALID_ROLES.includes(role as UserRole)) {
    return role as UserRole
  }
  return 'Worker'
}

export function authUserToAppUser(user: User): AppUser {
  return {
    dbId: Number(user.id),
    id: user.user_code ?? `u${user.id}`,
    name: user.name,
    role: normalizeRole(user.role, user.email),
    site: user.site ?? 'All Sites',
    phone: user.phone ?? undefined,
  }
}
