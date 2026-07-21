import { BaseService } from '@/services/base/BaseService'
import machineApi from '@/api/machine/machineApi'
import type { CreateMachineDto, Machine, UpdateMachineDto } from '@/interfaces/all/machine'

class MachineService extends BaseService<Machine, CreateMachineDto, UpdateMachineDto> {
  constructor() {
    super(machineApi)
  }
}

export const machineService = new MachineService()
export default machineService
