import { BaseService } from '@/services/base/BaseService'
import technicianApi from '@/api/technician/technicianApi'
import type { CreateTechnicianDto, Technician, UpdateTechnicianDto } from '@/interfaces/all/technician'

class TechnicianService extends BaseService<Technician, CreateTechnicianDto, UpdateTechnicianDto> {
  constructor() {
    super(technicianApi)
  }
}

export const technicianService = new TechnicianService()
export default technicianService
