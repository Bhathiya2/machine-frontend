import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Navigation,
  ShieldCheck,
  Truck,
  Wrench,
  XCircle,
} from 'lucide-react'
import type { FaultSeverity, MachineStatus, WorkOrderStatus } from '../types'

export function statusColor(status: MachineStatus) {
  switch (status) {
    case 'Operational':
      return 'bg-green-100 text-green-800'
    case 'Under Maintenance':
      return 'bg-yellow-100 text-yellow-800'
    case 'Broken':
      return 'bg-red-100 text-red-800'
    case 'Offline':
      return 'bg-gray-200 text-gray-600'
  }
}

export function woStatusColor(status: WorkOrderStatus) {
  switch (status) {
    case 'New':
      return 'bg-blue-100 text-blue-800'
    case 'Inprogress':
      return 'bg-yellow-100 text-yellow-800'
    case 'Finished':
      return 'bg-orange-100 text-orange-800'
    case 'Verified':
      return 'bg-green-100 text-green-800'
    case 'Close':
      return 'bg-red-100 text-red-700'
  }
}

export function woStatusIcon(status: WorkOrderStatus) {
  switch (status) {
    case 'New':
      return <Clock size={14} />
    case 'Inprogress':
      return <Wrench size={14} />
    case 'Finished':
      return <CheckCircle2 size={14} />
    case 'Verified':
      return <ShieldCheck size={14} />
    case 'Close':
      return <XCircle size={14} />
  }
}

export function machineStatusIcon(status: MachineStatus) {
  switch (status) {
    case 'Operational':
      return <CheckCircle2 size={14} className="text-green-600" />
    case 'Under Maintenance':
      return <Wrench size={14} className="text-yellow-600" />
    case 'Broken':
      return <XCircle size={14} className="text-red-600" />
    case 'Offline':
      return <AlertTriangle size={14} className="text-gray-500" />
  }
}

export function priorityColor(p: 'Low' | 'Medium' | 'High') {
  switch (p) {
    case 'Low':
      return 'bg-gray-100 text-gray-600'
    case 'Medium':
      return 'bg-blue-100 text-blue-700'
    case 'High':
      return 'bg-red-100 text-red-700'
  }
}

export function severityColor(s: FaultSeverity) {
  switch (s) {
    case 'Low':
      return 'bg-gray-100 text-gray-700'
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'High':
      return 'bg-orange-100 text-orange-800'
    case 'Critical':
      return 'bg-red-100 text-red-800'
  }
}
