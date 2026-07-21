/** Shared API / entity types */

export type EntityId = string | number

export interface Timestamps {
  created_at?: string
  updated_at?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export type SortOrder = 'asc' | 'desc'

export interface SortState {
  key: string | null
  order: SortOrder
}
