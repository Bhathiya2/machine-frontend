import type { AppUser } from '@/pages/dashboard/types'
import type { TechnicianFormData } from '@/pages/technicians/technicianMapper'

export interface TechnicianRepositoryInterface {
  getAll(): Promise<AppUser[]>
  create(form: TechnicianFormData): Promise<AppUser>
  update(dbId: number, form: TechnicianFormData): Promise<AppUser>
  delete(dbId: number): Promise<void>
}
