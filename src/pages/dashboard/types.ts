export type ViewName =
  | 'dashboard'
  | 'machines'
  | 'workorders'
  | 'faults'
  | 'notifications'
  | 'repairs'
  | 'analytics'
  | 'finance'
  | 'users'
  | 'roles'

export type MachineStatus = 'Operational' | 'Under Maintenance' | 'Broken' | 'Offline'

export type WorkOrderStatus =
  | 'Assigned'
  | 'Technician En Route'
  | 'Technician Arrived'
  | 'Work In Progress'
  | 'Work Completed'
  | 'Verified & Closed'
  | 'Cancelled'

export type UserRole = 'Super Admin' | 'Manager' | 'Technician' | 'Owner' | 'Worker' | 'Finance'

export type IssueCategory =
  | 'Mechanical'
  | 'Electrical'
  | 'Software / Firmware'
  | 'Hydraulic'
  | 'Preventive Maintenance'

export type FaultSeverity = 'Low' | 'Medium' | 'High' | 'Critical'

export type CostCategory =
  | 'Transportation'
  | 'Accommodation'
  | 'Labor'
  | 'Spare Part'
  | 'Others'

export interface CostEntry {
  id: string
  category: CostCategory
  amount: number
  quantity?: number
  unitPrice?: number
  date: string
  details?: string
}

export interface HistoryEntry {
  id: string
  date: string
  action: string
  by: string
}

export interface Machine {
  id: string
  dbId?: number
  name: string
  model: string
  site: string
  factoryGroup: string
  factory: string
  installDate: string
  installedBy: string
  status: MachineStatus
  history: HistoryEntry[]
}

export interface WorkOrder {
  id: string
  dbId?: number
  machineId: string
  title: string
  description: string
  assignedTo: string
  createdBy: string
  status: WorkOrderStatus
  createdAt: string
  updatedAt: string
  priority: 'Low' | 'Medium' | 'High'
  notes: string
  faultReportId?: string
  costEntries: CostEntry[]
}

export interface Notification {
  id: string
  dbId?: number
  userId: string
  message: string
  read: boolean
  workOrderId: string
  createdAt: string
}

export interface AppUser {
  id: string
  dbId?: number
  name: string
  email?: string
  role: UserRole
  roleId?: number
  site: string
  phone?: string
}

export interface RepairPhoto {
  id: string
  url: string
  type: 'before' | 'after'
  caption: string
}

export interface PartReplaced {
  name: string
  partNumber: string
  cost: number
}

export interface RepairRecord {
  id: string
  dbId?: number
  workOrderId: string
  machineId: string
  date: string
  issueCategory: IssueCategory
  issueDescription: string
  partsReplaced: PartReplaced[]
  laborCost: number
  totalCost: number
  technicianId: string
  photos: RepairPhoto[]
}

export interface FaultReport {
  id: string
  dbId?: number
  machineId: string
  reportedBy: string
  description: string
  severity: FaultSeverity
  category: IssueCategory
  status: 'Open' | 'Converted' | 'Dismissed'
  createdAt: string
  convertedToWO?: string
}
