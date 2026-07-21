import type { AppUser } from '@/pages/dashboard/types'
import type { UserFormData } from '@/pages/users/userMapper'
import { apiUserToAppUser, formToCreateDto, formToUpdateDto } from '@/pages/users/userMapper'
import userService from '@/services/all/user/UserService'

export interface UserRepositoryInterface {
  getAll(): Promise<AppUser[]>
  create(form: UserFormData): Promise<AppUser>
  update(dbId: number, form: UserFormData): Promise<AppUser>
  delete(dbId: number): Promise<void>
}

class UserRepository implements UserRepositoryInterface {
  async getAll(): Promise<AppUser[]> {
    const data = await userService.all()
    return data.map(apiUserToAppUser)
  }

  async create(form: UserFormData): Promise<AppUser> {
    const created = await userService.create(formToCreateDto(form))
    return apiUserToAppUser(created)
  }

  async update(dbId: number, form: UserFormData): Promise<AppUser> {
    const updated = await userService.update(dbId, formToUpdateDto(form))
    return apiUserToAppUser(updated)
  }

  async delete(dbId: number): Promise<void> {
    await userService.delete(dbId)
  }
}

export const userRepository = new UserRepository()
export default userRepository
