import type { CreateMachineDto, Machine as ApiMachine, UpdateMachineDto } from '@/interfaces/all/machine'
import type { Machine, MachineStatus } from '@/pages/dashboard/types'

export type MachineFormData = {
  id: string
  name: string
  model: string
  site: string
  factoryGroup: string
  factory: string
  installDate: string
  installedBy: string
  status: MachineStatus
}

const STATUS_MAP: Record<string, MachineStatus> = {
  active: 'Operational',
  operational: 'Operational',
  'under maintenance': 'Under Maintenance',
  broken: 'Broken',
  offline: 'Offline',
}

function normalizeStatus(status: string): MachineStatus {
  const mapped = STATUS_MAP[status.toLowerCase()]
  if (mapped) return mapped
  if (['Operational', 'Under Maintenance', 'Broken', 'Offline'].includes(status)) {
    return status as MachineStatus
  }
  return 'Operational'
}

function formatDate(value: string): string {
  return value.includes('T') ? value.split('T')[0] : value
}

export function apiMachineToUi(api: ApiMachine): Machine {
  return {
    dbId: Number(api.id),
    id: api.machine_number,
    name: api.name ?? '',
    model: api.model || '—',
    site: api.site ?? '',
    factoryGroup: api.factory_group ?? '',
    factory: api.factory ?? '',
    installDate: formatDate(api.install_date),
    installedBy: api.setup_by,
    status: normalizeStatus(api.status),
    history: [],
  }
}

export function formToCreateDto(form: MachineFormData): CreateMachineDto {
  return {
    machine_number: form.id.toUpperCase(),
    name: form.name.trim(),
    model: form.model.trim() || '—',
    site: form.site,
    install_date: form.installDate,
    setup_by: form.installedBy.trim(),
    factory_group: form.factoryGroup.trim(),
    factory: form.factory.trim(),
    status: form.status,
  }
}

export function formToUpdateDto(form: MachineFormData): UpdateMachineDto {
  return {
    machine_number: form.id.toUpperCase(),
    name: form.name.trim(),
    model: form.model.trim() || '—',
    site: form.site,
    install_date: form.installDate,
    setup_by: form.installedBy.trim(),
    factory_group: form.factoryGroup.trim(),
    factory: form.factory.trim(),
    status: form.status,
  }
}
