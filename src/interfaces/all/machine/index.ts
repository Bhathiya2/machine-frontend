import type { EntityId, Timestamps } from '@/interfaces/base/common'

export interface Machine extends Timestamps {
  id: EntityId
  machine_number: string
  name: string
  model: string
  site: string
  install_date: string
  setup_by: string
  factory_group: string
  factory: string
  status: string
}

export type CreateMachineDto = Omit<Machine, 'id' | 'created_at' | 'updated_at'>

export type UpdateMachineDto = Partial<CreateMachineDto>
