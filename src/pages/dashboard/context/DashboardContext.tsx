import { useCallback, useContext, useEffect, useMemo, useState, createContext, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { useAuthContext } from '@/context/AuthContext'
import type { WorkOrderFilters } from '@/interfaces/all/workOrder'
import {
  machineRepository,
  technicianRepository,
  userRepository,
  workOrderRepository,
  faultReportRepository,
  repairRecordRepository,
  notificationRepository,
} from '@/repositories'
import { authUserToAppUser, normalizeRole } from '@/utils/authUserMapper'
import { PERMISSIONS, roleHasPermission } from '../permissions'
import { VIEW_ROUTES } from '../constants'
import type { MachineFormData } from '@/pages/machines/machineMapper'
import type { WorkOrderFormData } from '@/pages/work-orders/workOrderMapper'
import type { TechnicianFormData } from '@/pages/technicians/technicianMapper'
import type { FaultFormData } from '@/pages/fault-reports/faultMapper'
import type { RepairFormData } from '@/pages/repair-records/repairMapper'
import type {
  AppUser,
  CostEntry,
  FaultReport,
  Machine,
  Notification,
  RepairRecord,
  ViewName,
  WorkOrder,
  WorkOrderStatus,
} from '../types'

interface DashboardContextValue {
  machines: Machine[]
  machinesLoading: boolean
  machinesSaving: boolean
  loadMachines: () => Promise<void>
  createMachine: (form: MachineFormData) => Promise<Machine | null>
  updateMachine: (dbId: number, form: MachineFormData) => Promise<Machine | null>
  deleteMachine: (dbId: number) => Promise<boolean>
  workOrders: WorkOrder[]
  workOrdersLoading: boolean
  workOrdersSaving: boolean
  loadWorkOrders: (filters?: WorkOrderFilters) => Promise<void>
  createWorkOrder: (form: WorkOrderFormData, createdBy: string) => Promise<WorkOrder | null>
  updateWorkOrder: (dbId: number, form: WorkOrderFormData) => Promise<WorkOrder | null>
  updateWorkOrderStatus: (dbId: number, status: WorkOrderStatus) => Promise<WorkOrder | null>
  updateWorkOrderNotes: (dbId: number, notes: string) => Promise<WorkOrder | null>
  updateWorkOrderCosts: (dbId: number, entries: CostEntry[]) => Promise<WorkOrder | null>
  deleteWorkOrder: (dbId: number) => Promise<boolean>
  checkInWorkOrder: (dbId: number) => Promise<WorkOrder | null>
  checkOutWorkOrder: (dbId: number) => Promise<WorkOrder | null>
  techniciansLoading: boolean
  techniciansSaving: boolean
  loadTechnicians: () => Promise<void>
  createTechnician: (form: TechnicianFormData) => Promise<AppUser | null>
  updateTechnician: (dbId: number, form: TechnicianFormData) => Promise<AppUser | null>
  deleteTechnician: (dbId: number) => Promise<boolean>
  usersLoading: boolean
  loadUsers: () => Promise<void>
  notifications: Notification[]
  loadNotifications: () => Promise<void>
  markNotificationRead: (dbId: number) => Promise<boolean>
  markAllNotificationsRead: () => Promise<boolean>
  repairRecords: RepairRecord[]
  loadRepairRecords: () => Promise<void>
  createRepairRecord: (form: RepairFormData) => Promise<RepairRecord | null>
  updateRepairRecord: (dbId: number, form: RepairFormData) => Promise<RepairRecord | null>
  deleteRepairRecord: (dbId: number) => Promise<boolean>
  faultReports: FaultReport[]
  loadFaultReports: () => Promise<void>
  createFaultReport: (form: FaultFormData) => Promise<FaultReport | null>
  dismissFaultReport: (dbId: number) => Promise<boolean>
  convertFaultToWorkOrder: (
    fault: FaultReport,
    assign: { technicianId: string; priority: 'Low' | 'Medium' | 'High' }
  ) => Promise<WorkOrder | null>
  currentUser: AppUser
  users: AppUser[]
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>
  unreadCount: number
  openFaultCount: number
  navigate: (view: ViewName | string, id?: string) => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const routerNavigate = useNavigate()
  const { user: authUser } = useAuthContext()
  const [machines, setMachines] = useState<Machine[]>([])
  const [machinesLoading, setMachinesLoading] = useState(true)
  const [machinesSaving, setMachinesSaving] = useState(false)
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [workOrdersLoading, setWorkOrdersLoading] = useState(true)
  const [workOrdersSaving, setWorkOrdersSaving] = useState(false)
  const [techniciansLoading, setTechniciansLoading] = useState(true)
  const [techniciansSaving, setTechniciansSaving] = useState(false)
  const [usersLoading, setUsersLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [repairRecords, setRepairRecords] = useState<RepairRecord[]>([])
  const [faultReports, setFaultReports] = useState<FaultReport[]>([])
  const [users, setUsers] = useState<AppUser[]>([])

  const currentUser = useMemo<AppUser>(() => {
    if (authUser) return authUserToAppUser(authUser)
    return { id: 'guest', name: 'Guest', role: 'Worker', site: 'All Sites' }
  }, [authUser])

  const canLoadTechnicians = useMemo(() => {
    const appUser = authUser ? authUserToAppUser(authUser) : null
    if (appUser?.role === 'Super Admin') return true
    const role = normalizeRole(authUser?.role, authUser?.email)
    return (
      roleHasPermission(role, PERMISSIONS.TECHNICIANS_MANAGE) ||
      roleHasPermission(role, PERMISSIONS.WORKORDERS_CREATE) ||
      roleHasPermission(role, PERMISSIONS.USERS_VIEW)
    )
  }, [authUser])

  const canLoadUsers = useMemo(() => {
    const appUser = authUser ? authUserToAppUser(authUser) : null
    if (appUser?.role === 'Super Admin') return true
    const role = normalizeRole(authUser?.role, authUser?.email)
    return roleHasPermission(role, PERMISSIONS.USERS_VIEW)
  }, [authUser])

  const canLoadFaults = useMemo(() => {
    const appUser = authUser ? authUserToAppUser(authUser) : null
    if (appUser?.role === 'Super Admin') return true
    const role = normalizeRole(authUser?.role, authUser?.email)
    return roleHasPermission(role, PERMISSIONS.FAULTS_VIEW)
  }, [authUser])

  const canLoadRepairs = useMemo(() => {
    const appUser = authUser ? authUserToAppUser(authUser) : null
    if (appUser?.role === 'Super Admin') return true
    const role = normalizeRole(authUser?.role, authUser?.email)
    return roleHasPermission(role, PERMISSIONS.REPAIRS_VIEW)
  }, [authUser])

  const canLoadNotifications = useMemo(() => {
    const appUser = authUser ? authUserToAppUser(authUser) : null
    if (appUser?.role === 'Super Admin') return true
    const role = normalizeRole(authUser?.role, authUser?.email)
    return roleHasPermission(role, PERMISSIONS.NOTIFICATIONS_VIEW)
  }, [authUser])

  const unreadCount = notifications.filter((n) => n.userId === currentUser.id && !n.read).length
  const openFaultCount = faultReports.filter((f) => f.status === 'Open').length

  const loadMachines = useCallback(async () => {
    setMachinesLoading(true)
    try {
      setMachines(await machineRepository.getAll())
    } catch {
      toast.error('Failed to load machines from server')
      setMachines([])
    } finally {
      setMachinesLoading(false)
    }
  }, [])

  const loadWorkOrders = useCallback(async (filters: WorkOrderFilters = {}) => {
    setWorkOrdersLoading(true)
    try {
      setWorkOrders(await workOrderRepository.list(filters))
    } catch {
      toast.error('Failed to load work orders from server')
      setWorkOrders([])
    } finally {
      setWorkOrdersLoading(false)
    }
  }, [])

  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      setUsers(await userRepository.getAll())
    } catch {
      toast.error('Failed to load users from server')
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }, [])

  const loadTechnicians = useCallback(async () => {
    setTechniciansLoading(true)
    try {
      await technicianRepository.getAll()
    } catch {
      toast.error('Failed to load technicians from server')
    } finally {
      setTechniciansLoading(false)
    }
  }, [])

  const loadFaultReports = useCallback(async () => {
    try {
      setFaultReports(await faultReportRepository.getAll())
    } catch {
      toast.error('Failed to load fault reports from server')
      setFaultReports([])
    }
  }, [])

  const loadRepairRecords = useCallback(async () => {
    try {
      setRepairRecords(await repairRecordRepository.getAll())
    } catch {
      toast.error('Failed to load repair records from server')
      setRepairRecords([])
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    try {
      setNotifications(await notificationRepository.getAll())
    } catch {
      toast.error('Failed to load notifications from server')
      setNotifications([])
    }
  }, [])

  useEffect(() => {
    loadMachines()
    loadWorkOrders()
    if (canLoadUsers) loadUsers()
    if (canLoadTechnicians) loadTechnicians()
    if (canLoadFaults) loadFaultReports()
    if (canLoadRepairs) loadRepairRecords()
    if (canLoadNotifications) loadNotifications()
  }, [
    loadMachines,
    loadWorkOrders,
    loadUsers,
    loadTechnicians,
    loadFaultReports,
    loadRepairRecords,
    loadNotifications,
    canLoadUsers,
    canLoadTechnicians,
    canLoadFaults,
    canLoadRepairs,
    canLoadNotifications,
  ])

  const createWorkOrder = useCallback(async (form: WorkOrderFormData, createdBy: string) => {
    setWorkOrdersSaving(true)
    try {
      const order = await workOrderRepository.create(form, createdBy)
      setWorkOrders((prev) => [order, ...prev])
      toast.success('Work order created')
      return order
    } catch {
      toast.error('Failed to create work order')
      return null
    } finally {
      setWorkOrdersSaving(false)
    }
  }, [])

  const updateWorkOrder = useCallback(async (dbId: number, form: WorkOrderFormData) => {
    setWorkOrdersSaving(true)
    try {
      const order = await workOrderRepository.update(dbId, form)
      setWorkOrders((prev) => prev.map((item) => (item.dbId === dbId ? order : item)))
      toast.success('Work order updated')
      return order
    } catch {
      toast.error('Failed to update work order')
      return null
    } finally {
      setWorkOrdersSaving(false)
    }
  }, [])

  const updateWorkOrderStatus = useCallback(async (dbId: number, status: WorkOrderStatus) => {
    setWorkOrdersSaving(true)
    try {
      const order = await workOrderRepository.updateStatus(dbId, status)
      setWorkOrders((prev) => prev.map((item) => (item.dbId === dbId ? order : item)))
      toast.success('Status updated')
      if (status === 'Verified') {
        await Promise.all([loadRepairRecords(), loadNotifications()])
      }
      return order
    } catch {
      toast.error('Failed to update status')
      return null
    } finally {
      setWorkOrdersSaving(false)
    }
  }, [loadRepairRecords, loadNotifications])

  const updateWorkOrderNotes = useCallback(async (dbId: number, notes: string) => {
    try {
      const order = await workOrderRepository.updateNotes(dbId, notes)
      setWorkOrders((prev) => prev.map((item) => (item.dbId === dbId ? order : item)))
      return order
    } catch {
      toast.error('Failed to save notes')
      return null
    }
  }, [])

  const updateWorkOrderCosts = useCallback(async (dbId: number, entries: CostEntry[]) => {
    try {
      const order = await workOrderRepository.updateCostEntries(dbId, entries)
      setWorkOrders((prev) => prev.map((item) => (item.dbId === dbId ? order : item)))
      toast.success('Cost entries saved')
      return order
    } catch {
      toast.error('Failed to save cost entries')
      return null
    }
  }, [])

  const deleteWorkOrder = useCallback(async (dbId: number) => {
    setWorkOrdersSaving(true)
    try {
      await workOrderRepository.delete(dbId)
      setWorkOrders((prev) => prev.filter((item) => item.dbId !== dbId))
      toast.success('Work order deleted')
      return true
    } catch {
      toast.error('Failed to delete work order')
      return false
    } finally {
      setWorkOrdersSaving(false)
    }
  }, [])

  const checkInWorkOrder = useCallback(async (dbId: number) => {
    setWorkOrdersSaving(true)
    try {
      const order = await workOrderRepository.checkIn(dbId)
      setWorkOrders((prev) => prev.map((item) => (item.dbId === dbId ? order : item)))
      toast.success('Checked in')
      return order
    } catch (e: any) {
      const message = e?.response?.data?.message ?? 'Failed to check in'
      toast.error(message)
      return null
    } finally {
      setWorkOrdersSaving(false)
    }
  }, [])

  const checkOutWorkOrder = useCallback(async (dbId: number) => {
    setWorkOrdersSaving(true)
    try {
      const order = await workOrderRepository.checkOut(dbId)
      setWorkOrders((prev) => prev.map((item) => (item.dbId === dbId ? order : item)))
      toast.success('Checked out')
      return order
    } catch (e: any) {
      const message = e?.response?.data?.message ?? 'Failed to check out'
      toast.error(message)
      return null
    } finally {
      setWorkOrdersSaving(false)
    }
  }, [])

  const createMachine = useCallback(async (form: MachineFormData) => {
    setMachinesSaving(true)
    try {
      const machine = await machineRepository.create(form)
      setMachines((prev) => [...prev, machine])
      toast.success('Machine created')
      return machine
    } catch {
      toast.error('Failed to create machine')
      return null
    } finally {
      setMachinesSaving(false)
    }
  }, [])

  const updateMachine = useCallback(async (dbId: number, form: MachineFormData) => {
    setMachinesSaving(true)
    try {
      const machine = await machineRepository.update(dbId, form)
      setMachines((prev) => prev.map((item) => (item.dbId === dbId ? machine : item)))
      toast.success('Machine updated')
      return machine
    } catch {
      toast.error('Failed to update machine')
      return null
    } finally {
      setMachinesSaving(false)
    }
  }, [])

  const deleteMachine = useCallback(async (dbId: number) => {
    setMachinesSaving(true)
    try {
      await machineRepository.delete(dbId)
      setMachines((prev) => prev.filter((item) => item.dbId !== dbId))
      toast.success('Machine deleted')
      return true
    } catch {
      toast.error('Failed to delete machine')
      return false
    } finally {
      setMachinesSaving(false)
    }
  }, [])

  const createTechnician = useCallback(async (form: TechnicianFormData) => {
    setTechniciansSaving(true)
    try {
      const technician = await technicianRepository.create(form)
      await loadUsers()
      toast.success('Technician created')
      return technician
    } catch {
      toast.error('Failed to create technician')
      return null
    } finally {
      setTechniciansSaving(false)
    }
  }, [loadUsers])

  const updateTechnician = useCallback(async (dbId: number, form: TechnicianFormData) => {
    setTechniciansSaving(true)
    try {
      const technician = await technicianRepository.update(dbId, form)
      await loadUsers()
      toast.success('Technician updated')
      return technician
    } catch {
      toast.error('Failed to update technician')
      return null
    } finally {
      setTechniciansSaving(false)
    }
  }, [loadUsers])

  const deleteTechnician = useCallback(async (dbId: number) => {
    setTechniciansSaving(true)
    try {
      await technicianRepository.delete(dbId)
      await loadUsers()
      toast.success('Technician deleted')
      return true
    } catch {
      toast.error('Failed to delete technician')
      return false
    } finally {
      setTechniciansSaving(false)
    }
  }, [loadUsers])

  const createFaultReport = useCallback(async (form: FaultFormData) => {
    try {
      const fault = await faultReportRepository.create(form, currentUser.id)
      setFaultReports((prev) => [fault, ...prev])
      toast.success('Fault report submitted')
      return fault
    } catch {
      toast.error('Failed to submit fault report')
      return null
    }
  }, [currentUser.id])

  const dismissFaultReport = useCallback(async (dbId: number) => {
    try {
      const updated = await faultReportRepository.dismiss(dbId)
      setFaultReports((prev) => prev.map((item) => (item.dbId === dbId ? updated : item)))
      toast.success('Fault report dismissed')
      return true
    } catch {
      toast.error('Failed to dismiss fault report')
      return false
    }
  }, [])

  const convertFaultToWorkOrder = useCallback(
    async (
      fault: FaultReport,
      assign: { technicianId: string; priority: 'Low' | 'Medium' | 'High' }
    ) => {
      if (!fault.dbId) {
        toast.error('Fault report is missing a server id')
        return null
      }
      setWorkOrdersSaving(true)
      try {
        const form: WorkOrderFormData = {
          machineId: fault.machineId,
          title: fault.description.slice(0, 60),
          description: fault.description,
          assignedTo: assign.technicianId,
          priority: assign.priority,
          status: 'New',
          notes: '',
          faultReportId: fault.id,
        }
        const order = await workOrderRepository.create(form, currentUser.id)
        await faultReportRepository.markConverted(fault.dbId, order.id)
        await Promise.all([loadFaultReports(), loadWorkOrders(), loadNotifications()])
        toast.success(`Work order ${order.id} created from fault`)
        return order
      } catch {
        toast.error('Failed to convert fault to work order')
        return null
      } finally {
        setWorkOrdersSaving(false)
      }
    },
    [currentUser.id, loadFaultReports, loadWorkOrders, loadNotifications]
  )

  const createRepairRecord = useCallback(async (form: RepairFormData) => {
    try {
      const record = await repairRecordRepository.create(form)
      setRepairRecords((prev) => [record, ...prev])
      toast.success('Repair record created')
      return record
    } catch {
      toast.error('Failed to create repair record')
      return null
    }
  }, [])

  const updateRepairRecord = useCallback(async (dbId: number, form: RepairFormData) => {
    try {
      const record = await repairRecordRepository.update(dbId, form)
      setRepairRecords((prev) => prev.map((item) => (item.dbId === dbId ? record : item)))
      toast.success('Repair record updated')
      return record
    } catch {
      toast.error('Failed to update repair record')
      return null
    }
  }, [])

  const deleteRepairRecord = useCallback(async (dbId: number) => {
    try {
      await repairRecordRepository.delete(dbId)
      setRepairRecords((prev) => prev.filter((item) => item.dbId !== dbId))
      toast.success('Repair record deleted')
      return true
    } catch {
      toast.error('Failed to delete repair record')
      return false
    }
  }, [])

  const markNotificationRead = useCallback(async (dbId: number) => {
    try {
      const updated = await notificationRepository.markRead(dbId)
      setNotifications((prev) => prev.map((item) => (item.dbId === dbId ? updated : item)))
      return true
    } catch {
      toast.error('Failed to mark notification as read')
      return false
    }
  }, [])

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await notificationRepository.markAllRead()
      setNotifications((prev) =>
        prev.map((item) => (item.userId === currentUser.id ? { ...item, read: true } : item))
      )
      return true
    } catch {
      toast.error('Failed to mark all notifications as read')
      return false
    }
  }, [currentUser.id])

  const navigate = useCallback(
    (view: ViewName | string, id?: string) => {
      const path = VIEW_ROUTES[view as ViewName] ?? '/dashboard'
      routerNavigate(id ? `${path}?focus=${encodeURIComponent(id)}` : path)
    },
    [routerNavigate]
  )

  const value = useMemo(
    () => ({
      machines,
      machinesLoading,
      machinesSaving,
      loadMachines,
      createMachine,
      updateMachine,
      deleteMachine,
      workOrders,
      workOrdersLoading,
      workOrdersSaving,
      loadWorkOrders,
      createWorkOrder,
      updateWorkOrder,
      updateWorkOrderStatus,
      updateWorkOrderNotes,
      updateWorkOrderCosts,
      deleteWorkOrder,
      checkInWorkOrder,
      checkOutWorkOrder,
      techniciansLoading,
      techniciansSaving,
      loadTechnicians,
      createTechnician,
      updateTechnician,
      deleteTechnician,
      usersLoading,
      loadUsers,
      notifications,
      loadNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      repairRecords,
      loadRepairRecords,
      createRepairRecord,
      updateRepairRecord,
      deleteRepairRecord,
      faultReports,
      loadFaultReports,
      createFaultReport,
      dismissFaultReport,
      convertFaultToWorkOrder,
      currentUser,
      users,
      setUsers,
      unreadCount,
      openFaultCount,
      navigate,
    }),
    [
      machines,
      machinesLoading,
      machinesSaving,
      loadMachines,
      createMachine,
      updateMachine,
      deleteMachine,
      workOrders,
      workOrdersLoading,
      workOrdersSaving,
      loadWorkOrders,
      createWorkOrder,
      updateWorkOrder,
      updateWorkOrderStatus,
      updateWorkOrderNotes,
      updateWorkOrderCosts,
      deleteWorkOrder,
      checkInWorkOrder,
      checkOutWorkOrder,
      techniciansLoading,
      techniciansSaving,
      loadTechnicians,
      createTechnician,
      updateTechnician,
      deleteTechnician,
      usersLoading,
      loadUsers,
      notifications,
      loadNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      repairRecords,
      loadRepairRecords,
      createRepairRecord,
      updateRepairRecord,
      deleteRepairRecord,
      faultReports,
      loadFaultReports,
      createFaultReport,
      dismissFaultReport,
      convertFaultToWorkOrder,
      currentUser,
      users,
      unreadCount,
      openFaultCount,
      navigate,
    ]
  )

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboardContext() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboardContext must be used within DashboardProvider')
  return ctx
}

export function useFocusId() {
  const [searchParams] = useSearchParams()
  return searchParams.get('focus') ?? undefined
}