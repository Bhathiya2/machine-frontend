import { createResourceHooks } from '@/hooks/base/commonHooks'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import userService from '@/services/all/user/UserService'
import type { User } from '@/interfaces/all/user'

export const { useList, useItem, useForm } = createResourceHooks<User>(userService, {
  resourceName: 'User',
  listPath: '/users',
  useNavigate,
  notify: toast,
  searchKeys: ['name', 'email'],
  enablePagination: true,
  pageSize: 10,
})
