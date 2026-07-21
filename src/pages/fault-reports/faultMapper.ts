import type { CreateFaultReportDto, FaultReportApi, UpdateFaultReportDto } from '@/interfaces/all/faultReport'
import type { FaultReport, FaultSeverity, IssueCategory } from '@/pages/dashboard/types'

export type FaultFormData = {
  machineId: string
  description: string
  severity: FaultSeverity
  category: IssueCategory
}

function formatDate(value: string): string {
  return value.includes('T') ? value.split('T')[0] : value
}

export function apiFaultToUi(api: FaultReportApi): FaultReport {
  return {
    dbId: Number(api.id),
    id: api.fault_number,
    machineId: api.machine_number ?? '',
    reportedBy: api.reported_by,
    description: api.description,
    severity: api.severity as FaultSeverity,
    category: api.category as IssueCategory,
    status: api.status as FaultReport['status'],
    createdAt: formatDate(String(api.created_at)),
    convertedToWO: api.converted_to_wo ?? undefined,
  }
}

export function formToCreateFaultDto(form: FaultFormData, reportedBy: string): CreateFaultReportDto {
  return {
    machine_number: form.machineId,
    reported_by: reportedBy,
    description: form.description.trim(),
    severity: form.severity,
    category: form.category,
  }
}

export function dismissFaultDto(): UpdateFaultReportDto {
  return { status: 'Dismissed' }
}

export function convertFaultDto(workOrderNumber: string): UpdateFaultReportDto {
  return { status: 'Converted', converted_to_wo: workOrderNumber }
}
