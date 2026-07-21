import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { useDebounce, useDisclosure } from '@/hooks/base/commonHooks'
import { usePermissions } from '@/hooks/permission/usePermissions'
import { TablePaginationBar, useTablePagination } from '@/components/TablePagination'
import { roleRepository, userRepository } from '@/repositories'
import { PERMISSIONS } from '@/pages/dashboard/permissions'
import { SITES } from '@/pages/dashboard/constants'
import { Badge, Card, FormField, inputCls, selectCls } from '@/pages/dashboard/components/DashboardUI'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { RoleItem } from '@/interfaces/all/role'
import type { UserFormData } from './userMapper'
import type { AppUser, UserRole, WorkOrder } from '@/pages/dashboard/types'

function roleBadgeClass(role: UserRole) {
  switch (role) {
    case 'Super Admin':
      return 'bg-red-600 text-white'
    case 'Owner':
      return 'bg-primary text-primary-foreground'
    case 'Manager':
      return 'bg-slate-800 text-white'
    case 'Technician':
      return 'bg-blue-100 text-blue-800'
    case 'Finance':
      return 'bg-violet-100 text-violet-800'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

const EMPTY_FORM = (roleId = 0): UserFormData => ({
  name: '',
  email: '',
  password: '',
  roleId,
  site: 'Plant A',
  phone: '',
})

interface UserManagementViewProps {
  currentUser: AppUser
  workOrders: WorkOrder[]
  focusId?: string
}

export function UserManagementView({ currentUser, workOrders, focusId }: UserManagementViewProps) {
  const { can } = usePermissions()
  const canManage = can(PERMISSIONS.USERS_CREATE)
  const canUpdate = can(PERMISSIONS.USERS_UPDATE)
  const canDelete = can(PERMISSIONS.USERS_DELETE)

  const formModal = useDisclosure(false)
  const deleteModal = useDisclosure(false)

  const [users, setUsers] = useState<AppUser[]>([])
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [form, setForm] = useState<UserFormData>(EMPTY_FORM())
  const [editTarget, setEditTarget] = useState<AppUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All')

  const debouncedSearch = useDebounce(search, 250)
  const defaultRoleId = roles.find((r) => r.name === 'Technician')?.id ?? roles[0]?.id

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [userData, roleData] = await Promise.all([
        userRepository.getAll(),
        roleRepository.getAll(),
      ])
      setUsers(userData)
      setRoles(roleData)
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string })?.message ?? 'Failed to load users'
        : 'Failed to load users'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!focusId || users.length === 0) return
    const user = users.find((item) => item.id === focusId)
    if (user) openEdit(user)
  }, [focusId, users])

  const filtered = useMemo(() => {
    const query = debouncedSearch.toLowerCase()
    return users.filter((user) => {
      const matchesRole = roleFilter === 'All' || user.role === roleFilter
      const matchesQuery =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query) ||
        (user.email ?? '').toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.site.toLowerCase().includes(query)
      return matchesRole && matchesQuery
    })
  }, [users, debouncedSearch, roleFilter])

  const pagination = useTablePagination(filtered, {
    pageSize: 5,
    resetKey: `${debouncedSearch}|${roleFilter}`,
  })
  const { pageItems } = pagination

  const roleOptions = useMemo(
    () => roles.map((role) => ({ id: Number(role.id), name: role.name as UserRole })),
    [roles]
  )

  const openCreate = () => {
    setFormMode('create')
    setEditTarget(null)
    setForm(EMPTY_FORM(Number(defaultRoleId)))
    formModal.open()
  }

  const openEdit = (user: AppUser) => {
    setFormMode('edit')
    setEditTarget(user)
    setForm({
      name: user.name,
      email: user.email ?? '',
      password: '',
      roleId: user.roleId ?? Number(defaultRoleId),
      site: user.site,
      phone: user.phone ?? '',
    })
    formModal.open()
  }

  const saveForm = async () => {
    if (!form.name.trim() || !form.email.trim()) return
    if (formMode === 'create' && !form.password.trim()) return
    setSaving(true)
    try {
      if (formMode === 'create') {
        await userRepository.create(form)
        toast.success('User created')
      } else if (editTarget?.dbId) {
        await userRepository.update(editTarget.dbId, form)
        toast.success('User updated')
      }
      formModal.close()
      await load()
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string })?.message ?? 'Save failed'
        : 'Save failed'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget?.dbId) return
    setSaving(true)
    try {
      await userRepository.delete(deleteTarget.dbId)
      toast.success('User deleted')
      deleteModal.close()
      setDeleteTarget(null)
      await load()
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string })?.message ?? 'Delete failed'
        : 'Delete failed'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const getOrderCount = (userId: string) =>
    workOrders.filter((order) => order.assignedTo === userId || order.createdBy === userId).length

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">User Management</h2>
          <p className="text-sm text-muted-foreground">{users.length} user(s) from database</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canManage && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              Add user
            </Button>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className={`${inputCls} pl-9`}
              placeholder="Search name, email, code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className={`${selectCls} sm:w-48`}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'All')}
          >
            <option value="All">All roles</option>
            {roleOptions.map((role) => (
              <option key={role.id} value={role.name}>{role.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Loading users…
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-4">Code</TableHead>
                <TableHead className="px-4">Name</TableHead>
                <TableHead className="px-4">Email</TableHead>
                <TableHead className="px-4">Role</TableHead>
                <TableHead className="px-4">Site</TableHead>
                <TableHead className="px-4">Phone</TableHead>
                <TableHead className="px-4">WOs</TableHead>
                <TableHead className="px-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-4 font-mono font-semibold text-primary">{user.id}</TableCell>
                    <TableCell className="px-4 font-medium">{user.name}</TableCell>
                    <TableCell className="px-4 text-sm text-muted-foreground">{user.email ?? '—'}</TableCell>
                    <TableCell className="px-4">
                      <Badge className={roleBadgeClass(user.role)}>{user.role}</Badge>
                    </TableCell>
                    <TableCell className="px-4 text-sm">{user.site}</TableCell>
                    <TableCell className="px-4 text-sm">{user.phone ?? '—'}</TableCell>
                    <TableCell className="px-4 text-sm">{getOrderCount(user.id)}</TableCell>
                    <TableCell className="px-4">
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(user)}>
                            <Pencil size={15} />
                          </Button>
                        )}
                        {canDelete && user.id !== currentUser.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive"
                            onClick={() => { setDeleteTarget(user); deleteModal.open() }}
                          >
                            <Trash2 size={15} />
                          </Button>
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
          label="user(s)"
        />
      </Card>

      {formModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="font-semibold">{formMode === 'create' ? 'Add user' : 'Edit user'}</h3>
              <button type="button" onClick={formModal.close}><X size={20} /></button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <FormField label="Full name">
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </FormField>
              <FormField label="Email">
                <input type="email" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </FormField>
              <FormField label={formMode === 'create' ? 'Password' : 'Password (leave blank to keep)'}>
                <input type="password" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Role">
                  <select className={selectCls} value={form.roleId} onChange={(e) => setForm({ ...form, roleId: Number(e.target.value) })}>
                    {roleOptions.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Site">
                  <select className={selectCls} value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })}>
                    <option value="All Sites">All Sites</option>
                    {SITES.map((site) => (
                      <option key={site} value={site}>{site}</option>
                    ))}
                  </select>
                </FormField>
              </div>
              <FormField label="Phone">
                <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </FormField>
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <Button variant="outline" onClick={formModal.close}>Cancel</Button>
              <Button onClick={saveForm} disabled={saving || !form.name.trim() || !form.email.trim()}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {formMode === 'create' ? 'Create user' : 'Save changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteModal.isOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border bg-card shadow-2xl">
            <div className="border-b px-6 py-4 font-semibold">Delete user</div>
            <p className="px-6 py-5 text-sm text-muted-foreground">
              Remove {deleteTarget.name} ({deleteTarget.id})?
            </p>
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
