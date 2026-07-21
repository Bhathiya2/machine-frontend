import type { AppUser } from '@/pages/dashboard/types'
import type { UserFormData } from '@/pages/users/userMapper'

export interface UserRepositoryInterface {
  getAll(): Promise<AppUser[]>
  create(form: UserFormData): Promise<AppUser>
  update(dbId: number, form: UserFormData): Promise<AppUser>
  delete(dbId: number): Promise<void>
}
