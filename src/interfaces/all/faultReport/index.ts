import type { EntityId, Timestamps } from '@/interfaces/base/common'

export interface FaultReportApi extends Timestamps {
  id: EntityId
  fault_number: string
  machine_number?: string
  reported_by: string
  description: string
  severity: string
  category: string
  status: string
  converted_to_wo?: string | null
}

export type CreateFaultReportDto = {
  machine_number: string
  reported_by: string
  description: string
  severity: string
  category: string
}

export type UpdateFaultReportDto = Partial<{
  description: string
  severity: string
  category: string
  status: string
  converted_to_wo: string | null
}>
