import type { EntityId, Timestamps } from '@/interfaces/base/common'

export interface Technician extends Timestamps {
  id: EntityId
  user_code: string
  name: string
  email: string
  role: string
  site: string
  phone: string | null
}

export type CreateTechnicianDto = {
  name: string
  email: string
  password: string
  site: string
  phone?: string
  user_code?: string
}

export type UpdateTechnicianDto = Partial<CreateTechnicianDto>
