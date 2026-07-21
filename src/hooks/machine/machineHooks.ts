import { createResourceHooks } from '@/hooks/base/commonHooks'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import machineService from '@/services/all/machine/MachineService'
import type { Machine } from '@/interfaces/all/machine'

export const { useList, useItem, useForm } = createResourceHooks<Machine>(machineService, {
  resourceName: 'Machine',
  listPath: '/machines',
  useNavigate,
  notify: toast,
  searchKeys: ['name', 'machine_number', 'site', 'status', 'factory'],
  enablePagination: true,
  pageSize: 10,
})
