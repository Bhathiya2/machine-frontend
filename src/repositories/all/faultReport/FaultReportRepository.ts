import faultReportService from '@/services/all/faultReport/FaultReportService'
import {
  apiFaultToUi,
  convertFaultDto,
  dismissFaultDto,
  formToCreateFaultDto,
  type FaultFormData,
} from '@/pages/fault-reports/faultMapper'
import type { FaultReport } from '@/pages/dashboard/types'

class FaultReportRepository {
  async getAll(): Promise<FaultReport[]> {
    const data = await faultReportService.all()
    return data.map(apiFaultToUi)
  }

  async create(form: FaultFormData, reportedBy: string): Promise<FaultReport> {
    const created = await faultReportService.create(formToCreateFaultDto(form, reportedBy))
    return apiFaultToUi(created)
  }

  async dismiss(dbId: number): Promise<FaultReport> {
    const updated = await faultReportService.update(dbId, dismissFaultDto())
    return apiFaultToUi(updated)
  }

  async markConverted(dbId: number, workOrderNumber: string): Promise<FaultReport> {
    const updated = await faultReportService.update(dbId, convertFaultDto(workOrderNumber))
    return apiFaultToUi(updated)
  }
}

export const faultReportRepository = new FaultReportRepository()
export default faultReportRepository
