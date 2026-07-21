import type { CreateRoleDto, RoleItem, UpdateRoleDto } from '@/interfaces/all/role'

export interface RoleRepositoryInterface {
  getAll(): Promise<RoleItem[]>
  create(form: CreateRoleDto): Promise<RoleItem>
  update(id: number, form: UpdateRoleDto): Promise<RoleItem>
  delete(id: number): Promise<void>
}
