import { BaseService } from '@/services/base/BaseService'
import repairRecordApi from '@/api/repairRecord/repairRecordApi'
import type { CreateRepairRecordDto, RepairRecordApi, UpdateRepairRecordDto } from '@/interfaces/all/repairRecord'

class RepairRecordService extends BaseService<RepairRecordApi, CreateRepairRecordDto, UpdateRepairRecordDto> {
  constructor() {
    super(repairRecordApi)
  }
}

export const repairRecordService = new RepairRecordService()
export default repairRecordService
