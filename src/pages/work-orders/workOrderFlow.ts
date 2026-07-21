import { WO_FLOW } from '@/pages/dashboard/constants'
import type { WorkOrderStatus } from '@/pages/dashboard/types'

export function isWoFinal(status: WorkOrderStatus) {
  return status === 'Verified & Closed' || status === 'Cancelled'
}

export function woFlowIndex(status: WorkOrderStatus) {
  if (status === 'Cancelled') return -1
  return WO_FLOW.indexOf(status)
}

export function woNextStatus(current: WorkOrderStatus): WorkOrderStatus | null {
  const idx = woFlowIndex(current)
  if (idx < 0 || idx >= WO_FLOW.length - 1) return null
  return WO_FLOW[idx + 1]
}

export function woFlowLabel(status: WorkOrderStatus) {
  switch (status) {
    case 'Assigned':
      return 'Assigned'
    case 'Technician En Route':
      return 'En Route'
    case 'Technician Arrived':
      return 'On Site'
    case 'Work In Progress':
      return 'In Progress'
    case 'Work Completed':
      return 'Completed'
    case 'Verified & Closed':
      return 'Verified'
    case 'Cancelled':
      return 'Cancelled'
  }
}

export function woActionLabel(target: WorkOrderStatus) {
  switch (target) {
    case 'Technician En Route':
      return 'Mark En Route'
    case 'Technician Arrived':
      return 'Check In'
    case 'Work In Progress':
      return 'Start Work'
    case 'Work Completed':
      return 'Mark Complete'
    case 'Verified & Closed':
      return 'Verify & Close'
    case 'Assigned':
      return 'Re-Open'
    default:
      return target
  }
}

export function canTransitionTo(current: WorkOrderStatus, target: WorkOrderStatus) {
  if (target === 'Cancelled') return !isWoFinal(current)
  if (isWoFinal(current) && target === 'Assigned') return true
  return woNextStatus(current) === target
}
