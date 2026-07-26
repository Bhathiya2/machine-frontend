import axios from 'axios'
import { usePermissions } from '@/hooks/permission/usePermissions'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Shield, Trash2, X, ChevronDown } from 'lucide-react'
import { permissionRepository, roleRepository } from '@/repositories'
import { PERMISSIONS } from '@/pages/dashboard/permissions'
import { TablePaginationBar, useTablePagination } from '@/components/TablePagination'
import { Badge, Card, FormField, inputCls } from '@/pages/dashboard/components/DashboardUI'
import { Button } from '@/components/ui/button'
import type { PermissionItem, RoleItem } from '@/interfaces/all/role'

const EMPTY_FORM = { name: '', description: '', permission_ids: [] as number[] }

export function RoleManagementView() {
  const { can } = usePermissions()
  const canCreate = can(PERMISSIONS.ROLES_CREATE)
  const canUpdate = can(PERMISSIONS.ROLES_UPDATE)
  const canDelete = can(PERMISSIONS.ROLES_DELETE)

  const [roles, setRoles] = useState<RoleItem[]>([])
  const [permissions, setPermissions] = useState<PermissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [selected, setSelected] = useState<RoleItem | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [openGroups, setOpenGroups] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [roleData, permissionData] = await Promise.all([
        roleRepository.getAll(),
        permissionRepository.getAll(),
      ])
      setRoles(roleData)
      setPermissions(permissionData)
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string })?.message
          ?? (error.response?.status === 403
            ? 'You do not have permission to view roles. Log out and sign in again.'
            : error.response?.status === 401
              ? 'Session expired. Please sign in again.'
              : 'Cannot reach roles API. Start backend with serve.bat and run setup.bat.')
        : 'Failed to load roles and permissions'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, PermissionItem[]>>((acc, permission) => {
      const group = permission.group
      if (!acc[group]) acc[group] = []
      acc[group].push(permission)
      return acc
    }, {})
  }, [permissions])

  const pagination = useTablePagination(roles, { pageSize: 5 })
  const { pageItems } = pagination

  const openCreate = () => {
    setMode('create')
    setSelected(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (role: RoleItem) => {
    setMode('edit')
    setSelected(role)
    setForm({
      name: role.name,
      description: role.description ?? '',
      permission_ids: role.permissions.map((p) => Number(p.id)),
    })
    setModalOpen(true)
  }

  const togglePermission = (permissionId: number) => {
    setForm((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permissionId)
        ? prev.permission_ids.filter((id) => id !== permissionId)
        : [...prev.permission_ids, permissionId],
    }))
  }

  const toggleGroup = (group: string) => {
    setOpenGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group],
    )
  }

  const toggleGroupPermissions = (items: PermissionItem[]) => {
    const itemIds = items.map(item => Number(item.id))
    const allSelected = itemIds.every(id => form.permission_ids.includes(id))
    setForm(prev => ({
      ...prev,
      permission_ids: allSelected
        ? prev.permission_ids.filter(id => !itemIds.includes(id))
        : [...new Set([...prev.permission_ids, ...itemIds])],
    }))
  }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (mode === 'create') {
        await roleRepository.create({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          permission_ids: form.permission_ids,
        })
        toast.success('Role created')
      } else if (selected) {
        await roleRepository.update(Number(selected.id), {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          permission_ids: form.permission_ids,
        })
        toast.success('Role updated')
      }
      setModalOpen(false)
      await load()
    } catch {
      toast.error(mode === 'create' ? 'Failed to create role' : 'Failed to update role')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (role: RoleItem) => {
    if (role.is_system) return
    setSaving(true)
    try {
      await roleRepository.delete(Number(role.id))
      toast.success('Role deleted')
      await load()
    } catch {
      toast.error('Failed to delete role')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Roles & Permissions</h2>
          <p className="text-sm text-muted-foreground">Create roles and assign permissions to control access.</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            New role
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading roles…</div>
        ) : (
          <>
            <div className="divide-y">
              {pageItems.map((role) => (
                <div key={role.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Shield className="size-4 text-primary" />
                      <span className="font-semibold">{role.name}</span>
                      {role.is_super_admin && <Badge className="bg-red-600 text-white">Super Admin</Badge>}
                      {role.is_system && !role.is_super_admin && <Badge>System</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{role.description || 'No description'}</p>
                    <p className="mt-1 text-xs font-mono text-muted-foreground">
                      {role.permissions.length} permission(s) · {role.users_count ?? 0} user(s)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {canUpdate && !role.is_super_admin && (
                      <Button variant="outline" size="sm" onClick={() => openEdit(role)}>
                        <Pencil className="size-4" />
                        Edit
                      </Button>
                    )}
                    {canDelete && !role.is_system && (
                      <Button variant="destructive" size="sm" onClick={() => remove(role)} disabled={saving}>
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
              label="role(s)"
            />
          </>
        )}
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="font-semibold">{mode === 'create' ? 'Create role' : 'Edit role permissions'}</h3>
              <button type="button" onClick={() => setModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <FormField label="Role name">
                <input
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  disabled={mode === 'edit' && selected?.is_system}
                />
              </FormField>
              <FormField label="Description">
                <input
                  className={inputCls}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </FormField>
              <div>
                <p className="mb-3 text-sm font-medium">Permissions</p>
                <div className="space-y-2">
                  {Object.entries(groupedPermissions).map(([group, items]) => {
                    const allSelected = items.every(item => form.permission_ids.includes(Number(item.id)))
                    const someSelected = items.some(item => form.permission_ids.includes(Number(item.id)))
                    const isOpen = openGroups.includes(group)

                    return (
                      <div key={group} className="rounded-lg border">
                        <div
                          className="flex cursor-pointer items-center justify-between p-3"
                          onClick={() => toggleGroup(group)}
                        >
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
                          <div className="flex items-center gap-3">
                            <label
                              className="flex items-center gap-2 text-sm"
                              onClick={e => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={allSelected}
                                ref={(el) => {
                                  if (el) el.indeterminate = someSelected && !allSelected
                                }}
                                onChange={() => toggleGroupPermissions(items)}
                              />
                              <span>Select all</span>
                            </label>
                            <ChevronDown className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} size={16} />
                          </div>
                        </div>
                        {isOpen && (
                          <div className="grid gap-2 border-t p-3 sm:grid-cols-2">
                            {items.map((permission) => (
                              <label key={permission.id} className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={form.permission_ids.includes(Number(permission.id))}
                                  onChange={() => togglePermission(Number(permission.id))}
                                />
                                <span>{permission.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving || !form.name.trim()}>
                {mode === 'create' ? 'Create role' : 'Save permissions'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
