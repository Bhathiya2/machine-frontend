import type { IssueCategory, ViewName, WorkOrderStatus } from './types'

export const WO_FLOW: WorkOrderStatus[] = [
  'New',
  'Inprogress',
  'Close',
  'Verified',
  'Finished',
]

export const SITES = ['Plant A', 'Plant B', 'Plant C', 'Plant D', 'Head Office']

export const CATEGORY_COLORS: Record<IssueCategory, string> = {
  Mechanical: '#1A2942',
  Electrical: '#F59E0B',
  'Software / Firmware': '#3B82F6',
  Hydraulic: '#10B981',
  'Preventive Maintenance': '#6B7280',
}

export const ISSUE_CATEGORIES: IssueCategory[] = [
  'Mechanical',
  'Electrical',
  'Software / Firmware',
  'Hydraulic',
  'Preventive Maintenance',
]

export const FINANCE_ROLES = ['Finance', 'Manager', 'Owner'] as const

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const COST_CATEGORIES = [
  'Transportation',
  'Accommodation',
  'Labor',
  'Spare Part',
  'Others',
] as const

export const COST_CATEGORY_META: Record<
  (typeof COST_CATEGORIES)[number],
  { color: string; bg: string; text: string }
> = {
  Transportation: { color: '#F59E0B', bg: 'bg-amber-100', text: 'text-amber-700' },
  Accommodation: { color: '#8B5CF6', bg: 'bg-violet-100', text: 'text-violet-700' },
  Labor: { color: '#3B82F6', bg: 'bg-blue-100', text: 'text-blue-700' },
  'Spare Part': { color: '#EC4899', bg: 'bg-pink-100', text: 'text-pink-700' },
  Others: { color: '#10B981', bg: 'bg-teal-100', text: 'text-teal-700' },
}

export const VIEW_LABELS = {
  dashboard: 'Dashboard',
  machines: 'Machines',
  workorders: 'Work Orders',
  faults: 'Fault Reports',
  notifications: 'Notifications',
  repairs: 'Repair Records',
  analytics: 'Analytics — 2024',
  finance: 'Finance',
  users: 'User Management',
  roles: 'Roles & Permissions',
} as const

export const VIEW_ROUTES: Record<ViewName, string> = {
  dashboard: '/dashboard',
  machines: '/machines',
  workorders: '/work-orders',
  faults: '/fault-reports',
  repairs: '/repair-records',
  analytics: '/analytics',
  finance: '/finance',
  notifications: '/notifications',
  users: '/users',
  roles: '/roles',
}

export function viewFromPath(pathname: string): ViewName {
  const entry = Object.entries(VIEW_ROUTES).find(([, path]) => path === pathname)
  return (entry?.[0] as ViewName) ?? 'dashboard'
}
