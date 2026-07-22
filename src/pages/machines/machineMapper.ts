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
  cert_reference?: string
  cert_calibration?: string
  cert_warranty?: string
  cert_contract?: string
  client_name?: string
  client_contact_person?: string
  client_phone_number?: string
  client_system?: string
  client_customer_code?: string
  client_job_title?: string
  client_email?: string
  client_expired_date?: string
  client_date_of_manufacture?: string
  tech_freq?: string
  tech_voltage?: string
  tech_amp?: string
  tech_total_mc_power?: string
  tech_ups?: string
  tech_chiller_cooling_system?: string
  tech_chiller_absorbed_power?: string
  tech_smoke_extractor?: string
  tech_room_temp?: string
  sign_completed?: boolean
  sign_incompleted?: boolean
  sign_signed_by?: string
  sign_technician_signature?: string
  sign_date?: string
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
    cert_reference: api.cert_reference,
    cert_calibration: api.cert_calibration,
    cert_warranty: api.cert_warranty,
    cert_contract: api.cert_contract,
    client_name: api.client_name,
    client_contact_person: api.client_contact_person,
    client_phone_number: api.client_phone_number,
    client_system: api.client_system,
    client_customer_code: api.client_customer_code,
    client_job_title: api.client_job_title,
    client_email: api.client_email,
    client_expired_date: api.client_expired_date,
    client_date_of_manufacture: api.client_date_of_manufacture,
    tech_freq: api.tech_freq,
    tech_voltage: api.tech_voltage,
    tech_amp: api.tech_amp,
    tech_total_mc_power: api.tech_total_mc_power,
    tech_ups: api.tech_ups,
    tech_chiller_cooling_system: api.tech_chiller_cooling_system,
    tech_chiller_absorbed_power: api.tech_chiller_absorbed_power,
    tech_smoke_extractor: api.tech_smoke_extractor,
    tech_room_temp: api.tech_room_temp,
    sign_completed: api.sign_completed,
    sign_incompleted: api.sign_incompleted,
    sign_signed_by: api.sign_signed_by,
    sign_technician_signature: api.sign_technician_signature,
    sign_date: api.sign_date,
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
    cert_reference: form.cert_reference,
    cert_calibration: form.cert_calibration,
    cert_warranty: form.cert_warranty,
    cert_contract: form.cert_contract,
    client_name: form.client_name,
    client_contact_person: form.client_contact_person,
    client_phone_number: form.client_phone_number,
    client_system: form.client_system,
    client_customer_code: form.client_customer_code,
    client_job_title: form.client_job_title,
    client_email: form.client_email,
    client_expired_date: form.client_expired_date,
    client_date_of_manufacture: form.client_date_of_manufacture,
    tech_freq: form.tech_freq,
    tech_voltage: form.tech_voltage,
    tech_amp: form.tech_amp,
    tech_total_mc_power: form.tech_total_mc_power,
    tech_ups: form.tech_ups,
    tech_chiller_cooling_system: form.tech_chiller_cooling_system,
    tech_chiller_absorbed_power: form.tech_chiller_absorbed_power,
    tech_smoke_extractor: form.tech_smoke_extractor,
    tech_room_temp: form.tech_room_temp,
    sign_completed: form.sign_completed,
    sign_incompleted: form.sign_incompleted,
    sign_signed_by: form.sign_signed_by,
    sign_technician_signature: form.sign_technician_signature,
    sign_date: form.sign_date,
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
    cert_reference: form.cert_reference,
    cert_calibration: form.cert_calibration,
    cert_warranty: form.cert_warranty,
    cert_contract: form.cert_contract,
    client_name: form.client_name,
    client_contact_person: form.client_contact_person,
    client_phone_number: form.client_phone_number,
    client_system: form.client_system,
    client_customer_code: form.client_customer_code,
    client_job_title: form.client_job_title,
    client_email: form.client_email,
    client_expired_date: form.client_expired_date,
    client_date_of_manufacture: form.client_date_of_manufacture,
    tech_freq: form.tech_freq,
    tech_voltage: form.tech_voltage,
    tech_amp: form.tech_amp,
    tech_total_mc_power: form.tech_total_mc_power,
    tech_ups: form.tech_ups,
    tech_chiller_cooling_system: form.tech_chiller_cooling_system,
    tech_chiller_absorbed_power: form.tech_chiller_absorbed_power,
    tech_smoke_extractor: form.tech_smoke_extractor,
    tech_room_temp: form.tech_room_temp,
    sign_completed: form.sign_completed,
    sign_incompleted: form.sign_incompleted,
    sign_signed_by: form.sign_signed_by,
    sign_technician_signature: form.sign_technician_signature,
    sign_date: form.sign_date,
  }
}
