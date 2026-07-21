import type { Technician } from '@/interfaces/all/technician'
import type { AppUser } from '@/pages/dashboard/types'

export type TechnicianFormData = {
  name: string
  email: string
  password: string
  site: string
  phone: string
}

export function apiTechnicianToUi(api: Technician): AppUser {
  return {
    dbId: Number(api.id),
    id: api.user_code,
    name: api.name,
    role: 'Technician',
    site: api.site,
    phone: api.phone ?? undefined,
  }
}

export function formToCreateDto(form: TechnicianFormData) {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    password: form.password,
    site: form.site,
    phone: form.phone.trim() || undefined,
  }
}

export function formToUpdateDto(form: Omit<TechnicianFormData, 'password'> & { password?: string }) {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    site: form.site,
    phone: form.phone.trim() || undefined,
    ...(form.password ? { password: form.password } : {}),
  }
}
