import type { EntityId, Timestamps } from '@/interfaces/base/common'

export interface RepairRecordApi extends Timestamps {
  id: EntityId
  repair_number: string
  work_order_number: string
  machine_number?: string
  date: string
  issue_category: string
  issue_description: string
  parts_replaced: Array<{ name: string; partNumber?: string; cost?: number }>
  labor_cost: number
  total_cost: number
  technician_id: string
  photos: Array<{ id: string; url: string; type: string; caption: string }>
}

export type CreateRepairRecordDto = {
  work_order_number: string
  machine_number: string
  date: string
  issue_category: string
  issue_description: string
  parts_replaced?: Array<{ name: string; partNumber?: string; cost?: number }>
  labor_cost?: number
  total_cost?: number
  technician_id: string
  photos?: Array<{ id: string; url: string; type: string; caption: string }>
}

export type UpdateRepairRecordDto = Partial<CreateRepairRecordDto>
