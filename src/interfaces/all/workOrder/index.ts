import type { EntityId, Timestamps } from '@/interfaces/base/common'
import type { Machine } from '@/interfaces/all/machine'

export interface ApiCostEntry {
  id: string
  category: string
  amount: number
  quantity?: number
  unitPrice?: number
  details?: string
  date: string
}

import type { ApiUser } from '../user';

export interface TechnicianNote {
  id: number;
  note: string;
  created_at: string;
  user?: ApiUser;
}

export interface WorkOrderActivity {
  id: number
  user_id: string
  action: string
  summary: string
  changes?: Record<string, unknown> | null
  created_at: string
  user?: ApiUser
}

export interface WorkOrderApi extends Timestamps {
  id: EntityId
  work_order_number: string
  machine_id: number
  title: string
  description: string | null
  assigned_to: string
  created_by: string
  status: string
  priority: string
  notes: string | null
  technician_notes?: TechnicianNote[]
  activities?: WorkOrderActivity[]
  fault_report_id: string | null
  cost_entries: ApiCostEntry[] | null
  machine?: Machine
}

export interface WorkOrderFilters {
  status?: string
  assigned_to?: string
  machine_number?: string
  from?: string
  to?: string
  search?: string
}

export type CreateWorkOrderDto = {
  machine_number: string
  title: string
  description?: string
  assigned_to: string
  created_by: string
  status?: string
  priority: string
  notes?: string
  fault_report_id?: string
  cost_entries?: ApiCostEntry[]
}

export type UpdateWorkOrderDto = Partial<CreateWorkOrderDto>
