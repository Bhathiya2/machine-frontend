import repairRecordService from '@/services/all/repairRecord/RepairRecordService'
import {
  apiRepairToUi,
  formToCreateRepairDto,
  formToUpdateRepairDto,
  type RepairFormData,
} from '@/pages/repair-records/repairMapper'
import type { RepairRecord } from '@/pages/dashboard/types'

class RepairRecordRepository {
  async getAll(): Promise<RepairRecord[]> {
    const data = await repairRecordService.all()
    return data.map(apiRepairToUi)
  }

  async create(form: RepairFormData): Promise<RepairRecord> {
    const created = await repairRecordService.createWithPhotos(
      formToCreateRepairDto(form),
      form.photoFiles,
      form.photoType,
    )
    return apiRepairToUi(created)
  }

  async update(dbId: number, form: RepairFormData): Promise<RepairRecord> {
    const updated = await repairRecordService.update(dbId, formToUpdateRepairDto(form))
    return apiRepairToUi(updated)
  }

  async delete(dbId: number): Promise<void> {
    await repairRecordService.delete(dbId)
  }
}

export const repairRecordRepository = new RepairRecordRepository()
export default repairRecordRepository
