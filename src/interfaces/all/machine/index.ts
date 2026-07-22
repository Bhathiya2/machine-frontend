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

export type CreateMachineDto = Omit<Machine, 'id' | 'created_at' | 'updated_at'>

export type UpdateMachineDto = Partial<CreateMachineDto>
