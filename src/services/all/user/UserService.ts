import { BaseService } from '@/services/base/BaseService'
import userApi from '@/api/user/userApi'
import type { CreateUserDto, UpdateUserDto, User } from '@/interfaces/all/user'

class UserService extends BaseService<User, CreateUserDto, UpdateUserDto> {
  constructor() {
    super(userApi)
  }
}

export const userService = new UserService()
export default userService
