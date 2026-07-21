import { BaseService } from '@/services/base/BaseService'
import roleApi from '@/api/role/roleApi'
import type { CreateRoleDto, RoleItem, UpdateRoleDto } from '@/interfaces/all/role'

class RoleService extends BaseService<RoleItem, CreateRoleDto, UpdateRoleDto> {
  constructor() {
    super(roleApi)
  }
}

export const roleService = new RoleService()
export default roleService
