import technicianService from '@/services/all/technician/TechnicianService'
import {
  apiTechnicianToUi,
  formToCreateDto,
  formToUpdateDto,
  type TechnicianFormData,
} from '@/pages/technicians/technicianMapper'
import type { AppUser } from '@/pages/dashboard/types'
import type { TechnicianRepositoryInterface } from './TechnicianRepositoryInterface'

class TechnicianRepository implements TechnicianRepositoryInterface {
  async getAll(): Promise<AppUser[]> {
    const data = await technicianService.all()
    return data.map(apiTechnicianToUi)
  }

  async create(form: TechnicianFormData): Promise<AppUser> {
    const created = await technicianService.create(formToCreateDto(form))
    return apiTechnicianToUi(created)
  }

  async update(dbId: number, form: TechnicianFormData): Promise<AppUser> {
    const updated = await technicianService.update(dbId, formToUpdateDto(form))
    return apiTechnicianToUi(updated)
  }

  async delete(dbId: number): Promise<void> {
    await technicianService.delete(dbId)
  }
}

export const technicianRepository = new TechnicianRepository()
export default technicianRepository
