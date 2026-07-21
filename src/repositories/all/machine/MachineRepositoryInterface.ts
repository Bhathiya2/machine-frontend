import type { Machine } from '@/pages/dashboard/types'
import type { MachineFormData } from '@/pages/machines/machineMapper'

export interface MachineRepositoryInterface {
  getAll(): Promise<Machine[]>
  create(form: MachineFormData): Promise<Machine>
  update(dbId: number, form: MachineFormData): Promise<Machine>
  delete(dbId: number): Promise<void>
}
