import type { EntityId, SortOrder } from '@/interfaces/base/common'
import type { NavigateFunction } from 'react-router'

export interface NotifyAdapter {
  success?: (message: string) => void
  error?: (message: string) => void
}

export interface ResourceMessages {
  loadError?: string
  notFound?: string
  deleted?: string
  deleteError?: string
  created?: string
  updated?: string
  createError?: string
  updateError?: string
  bulkDeleted?: string
  bulkUpdated?: string
  bulkDeleteError?: string
  bulkUpdateError?: string
}

export interface ResourceHooksConfig<T> {
  resourceName?: string
  listPath?: string
  useNavigate?: () => NavigateFunction | undefined
  notify?: NotifyAdapter
  mapToForm?: (data: T) => Record<string, unknown>
  getId?: (item: T) => EntityId
  messages?: ResourceMessages
  searchKeys?: (keyof T & string)[]
  filterFn?: (item: T, filters: Record<string, unknown>) => boolean
  defaultSort?: { key: keyof T & string | null; order: SortOrder }
  pageSize?: number
  enablePagination?: boolean
  enableOptimistic?: boolean
  cacheTtl?: number
  cacheKey?: string
  retryCount?: number
  retryDelay?: number
}

export interface IResourceService<T, CreateDto = Partial<T>, UpdateDto = Partial<T>> {
  all(): Promise<T[]>
  find(id: EntityId): Promise<T>
  create(data: CreateDto): Promise<T>
  update(id: EntityId, data: UpdateDto): Promise<T>
  delete(id: EntityId): Promise<void>
}

export interface ValidationRules<T extends Record<string, unknown>> {
  [field: string]: (value: unknown, allValues: T) => string | undefined
}

export interface AuthUser {
  id?: EntityId
  name?: string
  email?: string
  role?: string
  roles?: string[]
  permissions?: string[]
}

export interface HotkeyBinding {
  key: string
  ctrl: boolean
  shift: boolean
  alt: boolean
  meta: boolean
}

export type HotkeyMap = Record<string, (event: KeyboardEvent) => void>
