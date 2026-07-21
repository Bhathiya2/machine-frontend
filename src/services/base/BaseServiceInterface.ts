import type { EntityId, PaginatedResponse } from '@/interfaces/base/common'

export interface IBaseService<T, CreateDto = Partial<T>, UpdateDto = Partial<T>> {
  all(): Promise<T[]>
  paginate(page?: number, perPage?: number): Promise<PaginatedResponse<T>>
  find(id: EntityId): Promise<T>
  create(data: CreateDto): Promise<T>
  update(id: EntityId, data: UpdateDto): Promise<T>
  delete(id: EntityId): Promise<void>
}
