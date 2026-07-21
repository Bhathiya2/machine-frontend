import { BaseService } from '@/services/base/BaseService'
import faultReportApi from '@/api/faultReport/faultReportApi'
import type { CreateFaultReportDto, FaultReportApi, UpdateFaultReportDto } from '@/interfaces/all/faultReport'

class FaultReportService extends BaseService<FaultReportApi, CreateFaultReportDto, UpdateFaultReportDto> {
  constructor() {
    super(faultReportApi)
  }
}

export const faultReportService = new FaultReportService()
export default faultReportService
