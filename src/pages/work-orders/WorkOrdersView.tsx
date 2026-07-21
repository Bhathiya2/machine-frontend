import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  Loader2,
  Navigation,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Truck,
  Wrench,
  X,
  XCircle,
} from 'lucide-react'
import type { WorkOrderFilters } from '@/interfaces/all/workOrder'
import { useDebounce, useDisclosure } from '@/hooks/base/commonHooks'
import { usePermissions } from '@/hooks/permission/usePermissions'
import { TablePaginationBar, useTablePagination } from '@/components/TablePagination'
import { PERMISSIONS } from '@/pages/dashboard/permissions'
import { WO_FLOW } from '@/pages/dashboard/constants'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge, Card, FormField, inputCls, selectCls } from '@/pages/dashboard/components/DashboardUI'
import { formatDate } from '@/pages/dashboard/utils/formatters'
import { priorityColor, woStatusColor, woStatusIcon } from '@/pages/dashboard/utils/statusHelpers'
import type { WorkOrderFormData } from './workOrderMapper'
import {
  canTransitionTo,
  isWoFinal,
  woActionLabel,
  woFlowIndex,
  woFlowLabel,
  woNextStatus,
} from './workOrderFlow'
import type { AppUser, FaultReport, Machine, WorkOrder, WorkOrderStatus } from '@/pages/dashboard/types'

const STATUSES: Array<WorkOrderStatus | 'All'> = [
  'All',
  'Assigned',
  'Technician En Route',
  'Technician Arrived',
  'Work In Progress',
  'Work Completed',
  'Verified & Closed',
  'Cancelled',
]

const EMPTY_FORM: WorkOrderFormData = {
  machineId: '',
  title: '',
  description: '',
  assignedTo: '',
  priority: 'Medium',
  status: 'Assigned',
  notes: '',
}

interface WorkOrdersViewProps {
  workOrders: WorkOrder[]
  loading: boolean
  saving: boolean
  onRefresh: (filters?: WorkOrderFilters) => Promise<void>
  onCreate: (form: WorkOrderFormData, createdBy: string) => Promise<WorkOrder | null>
  onUpdate: (dbId: number, form: WorkOrderFormData) => Promise<WorkOrder | null>
  onUpdateStatus: (dbId: number, status: WorkOrderStatus) => Promise<WorkOrder | null>
  onUpdateNotes: (dbId: number, notes: string) => Promise<WorkOrder | null>
  onDelete: (dbId: number) => Promise<boolean>
  machines: Machine[]
  users: AppUser[]
  currentUser: AppUser
  focusId?: string
  faultReports: FaultReport[]
  onRefreshNotifications?: () => Promise<void>
}

export function WorkOrdersView({
  workOrders,
  loading,
  saving,
  onRefresh,
  onCreate,
  onUpdate,
  onUpdateStatus,
  onUpdateNotes,
  onDelete,
  machines,
  users,
  currentUser,
  focusId,
  onRefreshNotifications,
}: WorkOrdersViewProps) {
  const formModal = useDisclosure(false)
  const viewModal = useDisclosure(false)
  const deleteModal = useDisclosure(false)

  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [form, setForm] = useState<WorkOrderFormData>(EMPTY_FORM)
  const [viewOrder, setViewOrder] = useState<WorkOrder | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WorkOrder | null>(null)
  const [notesDraft, setNotesDraft] = useState('')
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'All'>('All')
  const [technicianFilter, setTechnicianFilter] = useState('All')
  const [machineFilter, setMachineFilter] = useState('All')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const debouncedSearch = useDebounce(search, 250)
  const { can, canUpdateWorkOrderStatus, canUpdateWorkOrderNotes } = usePermissions()
  const technicians = users.filter((user) => user.role === 'Technician')
  const canManage = can(PERMISSIONS.WORKORDERS_CREATE)

  const filters = useMemo<WorkOrderFilters>(
    () => ({
      search: debouncedSearch || undefined,
      status: statusFilter !== 'All' ? statusFilter : undefined,
      assigned_to: technicianFilter !== 'All' ? technicianFilter : undefined,
      machine_number: machineFilter !== 'All' ? machineFilter : undefined,
      from: dateFrom || undefined,
      to: dateTo || undefined,
    }),
    [debouncedSearch, statusFilter, technicianFilter, machineFilter, dateFrom, dateTo]
  )

  useEffect(() => {
    onRefresh(filters)
  }, [filters, onRefresh])

  useEffect(() => {
    if (!focusId) return
    const order = workOrders.find((item) => item.id === focusId)
    if (order) {
      setViewOrder(order)
      setNotesDraft(order.notes)
      viewModal.open()
    }
  }, [focusId, workOrders])

  const sortedOrders = useMemo(() => {
    const rank = (status: WorkOrderStatus) =>
      status === 'Verified & Closed' || status === 'Cancelled' ? 1 : 0
    return [...workOrders].sort((a, b) => {
      const byStatus = rank(a.status) - rank(b.status)
      if (byStatus !== 0) return byStatus
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [workOrders])

  const pagination = useTablePagination(sortedOrders, {
    pageSize: 5,
    resetKey: filters,
  })
  const { pageItems } = pagination

  const getUserName = (id: string) => users.find((user) => user.id === id)?.name ?? id

  const openCreate = () => {
    setFormMode('create')
    setForm(EMPTY_FORM)
    formModal.open()
  }

  const openEdit = (order: WorkOrder) => {
    setEditingOrderId(order.id)
    setFormMode('edit')
    setForm({
      machineId: order.machineId,
      title: order.title,
      description: order.description,
      assignedTo: order.assignedTo,
      priority: order.priority,
      status: order.status,
      notes: order.notes,
      faultReportId: order.faultReportId,
    })
    formModal.open()
  }

  const saveForm = async () => {
    if (!form.machineId || !form.title.trim() || !form.assignedTo || saving) return

    if (formMode === 'create') {
      const created = await onCreate(form, currentUser.id)
      if (created) {
        await onRefreshNotifications?.()
        formModal.close()
      }
      return
    }

    const order = workOrders.find((item) => item.id === editingOrderId)
    if (!order?.dbId) return
    const updated = await onUpdate(order.dbId, form)
    if (updated) {
      formModal.close()
      if (viewOrder?.id === updated.id) setViewOrder(updated)
    }
  }

  const openView = (order: WorkOrder) => {
    setViewOrder(order)
    setNotesDraft(order.notes)
    viewModal.open()
  }

  const jumpStatus = async (order: WorkOrder, status: WorkOrderStatus) => {
    if (!order.dbId || !canTransitionTo(order.status, status)) return
    const updated = await onUpdateStatus(order.dbId, status)
    if (updated) {
      setViewOrder(updated)
      await onRefreshNotifications?.()
    }
  }

  const saveNotes = async () => {
    if (!viewOrder?.dbId) return
    const updated = await onUpdateNotes(viewOrder.dbId, notesDraft)
    if (updated) setViewOrder(updated)
  }

  const confirmDelete = async () => {
    if (!deleteTarget?.dbId || saving) return
    const deleted = await onDelete(deleteTarget.dbId)
    if (!deleted) return
    if (viewOrder?.id === deleteTarget.id) {
      viewModal.close()
      setViewOrder(null)
    }
    deleteModal.close()
    setDeleteTarget(null)
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setTechnicianFilter('All')
    setMachineFilter('All')
    setDateFrom('')
    setDateTo('')
  }

  const activeView = viewOrder ? workOrders.find((order) => order.id === viewOrder.id) ?? viewOrder : null
  const nextStatus = activeView ? woNextStatus(activeView.status) : null
  const canAdvance =
    activeView && nextStatus ? canUpdateWorkOrderStatus(activeView, nextStatus) : false
  const canReopen =
    activeView && isWoFinal(activeView.status)
      ? canUpdateWorkOrderStatus(activeView, 'Assigned')
      : false

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-4 text-sm"
              placeholder="Search WO, title, machine…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select className={selectCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as WorkOrderStatus | 'All')}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>{status === 'All' ? 'All statuses' : status}</option>
            ))}
          </select>
          <select className={selectCls} value={technicianFilter} onChange={(e) => setTechnicianFilter(e.target.value)}>
            <option value="All">All technicians</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>{tech.name}</option>
            ))}
          </select>
          <select className={selectCls} value={machineFilter} onChange={(e) => setMachineFilter(e.target.value)}>
            <option value="All">All machines</option>
            {machines.map((machine) => (
              <option key={machine.id} value={machine.id}>{machine.id} — {machine.name}</option>
            ))}
          </select>
          <input type="date" className={inputCls} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input type="date" className={inputCls} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
          <Button variant="outline" size="sm" onClick={() => onRefresh(filters)} disabled={loading || saving}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </Button>
          {canManage && (
            <Button size="sm" onClick={openCreate} disabled={loading || saving}>
              <Plus size={14} /> New work order
            </Button>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading && pageItems.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" /> Loading work orders…
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="px-4">Work order</TableHead>
                <TableHead className="px-4">Title</TableHead>
                <TableHead className="px-4">Machine</TableHead>
                <TableHead className="px-4">Technician</TableHead>
                <TableHead className="px-4">Status</TableHead>
                <TableHead className="px-4">Priority</TableHead>
                <TableHead className="px-4">Created</TableHead>
                <TableHead className="px-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No work orders found
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((order) => (
                  <TableRow key={order.id} className={loading ? 'opacity-60' : undefined}>
                    <TableCell className="px-4 font-mono font-semibold text-primary">{order.id}</TableCell>
                    <TableCell className="px-4 max-w-[200px] truncate font-medium">{order.title}</TableCell>
                    <TableCell className="px-4 font-mono text-sm">{order.machineId}</TableCell>
                    <TableCell className="px-4 text-sm">{getUserName(order.assignedTo)}</TableCell>
                    <TableCell className="px-4">
                      <Badge className={woStatusColor(order.status)}>{woStatusIcon(order.status)}{order.status}</Badge>
                    </TableCell>
                    <TableCell className="px-4">
                      <Badge className={priorityColor(order.priority)}>{order.priority}</Badge>
                    </TableCell>
                    <TableCell className="px-4 text-sm text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                    <TableCell className="px-4">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => openView(order)}><Eye size={15} /></Button>
                        {canManage && (
                          <>
                            <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(order)}><Pencil size={15} /></Button>
                            <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => { setDeleteTarget(order); deleteModal.open() }}><Trash2 size={15} /></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        <TablePaginationBar
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          pageNumbers={pagination.pageNumbers}
          disabled={loading}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
          label="work order(s)"
        />
      </Card>

      {formModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="font-semibold">{formMode === 'create' ? 'Create work order' : 'Edit work order'}</h2>
              <button type="button" onClick={formModal.close}><X size={20} /></button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <FormField label="Machine">
                <select className={selectCls} value={form.machineId} onChange={(e) => setForm({ ...form, machineId: e.target.value })}>
                  <option value="">Select machine…</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>{machine.id} — {machine.name} ({machine.site})</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Title">
                <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </FormField>
              <FormField label="Description">
                <textarea className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Assign technician">
                  <select className={selectCls} value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                    <option value="">Select technician…</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>{tech.name} ({tech.site})</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Priority">
                  <select className={selectCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as WorkOrderFormData['priority'] })}>
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </FormField>
              </div>
              {formMode === 'edit' && (
                <FormField label="Status">
                  <select className={selectCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as WorkOrderStatus })}>
                    {STATUSES.filter((s) => s !== 'All').map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </FormField>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <Button variant="outline" onClick={formModal.close}>Cancel</Button>
              <Button onClick={saveForm} disabled={!form.machineId || !form.title.trim() || !form.assignedTo || saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {formMode === 'create' ? 'Create & assign' : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {viewModal.isOpen && activeView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border bg-card shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between border-b bg-card px-6 py-4">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-primary">{activeView.id}</span>
                  <Badge className={woStatusColor(activeView.status)}>{woStatusIcon(activeView.status)}{activeView.status}</Badge>
                  <Badge className={priorityColor(activeView.priority)}>{activeView.priority}</Badge>
                </div>
                <h2 className="text-lg font-semibold">{activeView.title}</h2>
                <p className="text-sm text-muted-foreground">{activeView.machineId} · {getUserName(activeView.assignedTo)}</p>
              </div>
              <button type="button" onClick={viewModal.close}><X size={20} /></button>
            </div>
            <div className="space-y-4 p-6">
              <p className="text-sm leading-relaxed">{activeView.description}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3"><span className="text-xs text-muted-foreground">Created</span><p className="font-medium">{formatDate(activeView.createdAt)}</p></div>
                <div className="rounded-lg border p-3"><span className="text-xs text-muted-foreground">Updated</span><p className="font-medium">{formatDate(activeView.updatedAt)}</p></div>
              </div>
              <FormField label="Technician notes">
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  onBlur={saveNotes}
                  readOnly={!canUpdateWorkOrderNotes(activeView)}
                />
              </FormField>

              <div className="space-y-3 border-t pt-4">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Status flow</p>
                {activeView.status === 'Cancelled' ? (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                    <XCircle size={15} />
                    This work order has been cancelled.
                  </div>
                ) : (
                  <div className="flex items-start overflow-x-auto pb-1">
                    {WO_FLOW.map((step, index) => {
                      const currentIdx = woFlowIndex(activeView.status)
                      const done = index <= currentIdx
                      const active = index === currentIdx
                      return (
                        <div key={step} className="flex shrink-0 items-center">
                          <div className="flex w-14 flex-col items-center">
                            <div
                              className={`flex size-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                                done ? 'bg-primary text-white' : 'border border-border bg-muted text-muted-foreground'
                              } ${active ? 'ring-2 ring-primary/30 ring-offset-1' : ''}`}
                            >
                              {index < currentIdx ? <CheckCircle2 size={13} /> : index + 1}
                            </div>
                            <span
                              className={`mt-1 text-center text-[10px] font-mono leading-tight ${
                                done ? 'font-semibold text-primary' : 'text-muted-foreground'
                              }`}
                            >
                              {woFlowLabel(step)}
                            </span>
                          </div>
                          {index < WO_FLOW.length - 1 && (
                            <div className={`mb-3 h-0.5 w-4 shrink-0 ${index < currentIdx ? 'bg-primary' : 'bg-border'}`} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {!isWoFinal(activeView.status) && (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Next action</p>
                  {canAdvance && nextStatus ? (
                    <Button
                      className="w-full sm:w-auto"
                      disabled={saving}
                      onClick={() => jumpStatus(activeView, nextStatus)}
                    >
                      {nextStatus === 'Technician En Route' && <Truck size={15} />}
                      {nextStatus === 'Technician Arrived' && <Navigation size={15} />}
                      {nextStatus === 'Work In Progress' && <Wrench size={15} />}
                      {nextStatus === 'Work Completed' && <CheckCircle2 size={15} />}
                      {nextStatus === 'Verified & Closed' && <ShieldCheck size={15} />}
                      {woActionLabel(nextStatus)}
                    </Button>
                  ) : activeView.status === 'Work Completed' ? (
                    <p className="text-sm text-muted-foreground">
                      Work is complete. Waiting for manager or owner to verify and close.
                    </p>
                  ) : canUpdateWorkOrderStatus(activeView) ? (
                    <p className="text-sm text-muted-foreground">
                      Only the assigned technician can advance this work order.
                    </p>
                  ) : null}

                  {can(PERMISSIONS.WORKORDERS_CANCEL) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={saving}
                      onClick={() => jumpStatus(activeView, 'Cancelled')}
                    >
                      <XCircle size={15} />
                      Cancel WO
                    </Button>
                  )}
                </div>
              )}

              {canReopen && (
                <div className="border-t pt-4">
                  <Button
                    variant="outline"
                    disabled={saving}
                    onClick={() => jumpStatus(activeView, 'Assigned')}
                  >
                    <ArrowRight size={15} />
                    Re-Open work order
                  </Button>
                </div>
              )}

              {isWoFinal(activeView.status) && activeView.status === 'Verified & Closed' && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-800">
                  <ShieldCheck size={15} />
                  This work order is verified and closed.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteModal.isOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border bg-card shadow-2xl">
            <div className="border-b px-6 py-4 font-semibold">Delete work order</div>
            <p className="px-6 py-5 text-sm text-muted-foreground">Remove {deleteTarget.id} — {deleteTarget.title}?</p>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <Button variant="outline" onClick={deleteModal.close}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={saving}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
