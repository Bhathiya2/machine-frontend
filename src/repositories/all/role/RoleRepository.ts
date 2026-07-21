import roleService from '@/services/all/role/RoleService'
import type { CreateRoleDto, RoleItem, UpdateRoleDto } from '@/interfaces/all/role'
import type { RoleRepositoryInterface } from './RoleRepositoryInterface'

class RoleRepository implements RoleRepositoryInterface {
  async getAll(): Promise<RoleItem[]> {
    return roleService.all()
  }

  async create(form: CreateRoleDto): Promise<RoleItem> {
    return roleService.create(form)
  }

  async update(id: number, form: UpdateRoleDto): Promise<RoleItem> {
    return roleService.update(id, form)
  }

  async delete(id: number): Promise<void> {
    await roleService.delete(id)
  }
}

export const roleRepository = new RoleRepository()
export default roleRepository
