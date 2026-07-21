import machineService from '@/services/all/machine/MachineService'
import {
  apiMachineToUi,
  formToCreateDto,
  formToUpdateDto,
  type MachineFormData,
} from '@/pages/machines/machineMapper'
import type { Machine } from '@/pages/dashboard/types'
import type { MachineRepositoryInterface } from './MachineRepositoryInterface'

class MachineRepository implements MachineRepositoryInterface {
  async getAll(): Promise<Machine[]> {
    const data = await machineService.all()
    return data.map(apiMachineToUi)
  }

  async create(form: MachineFormData): Promise<Machine> {
    const created = await machineService.create(formToCreateDto(form))
    return apiMachineToUi(created)
  }

  async update(dbId: number, form: MachineFormData): Promise<Machine> {
    const updated = await machineService.update(dbId, formToUpdateDto(form))
    return apiMachineToUi(updated)
  }

  async delete(dbId: number): Promise<void> {
    await machineService.delete(dbId)
  }
}

export const machineRepository = new MachineRepository()
export default machineRepository
