import type { BaseApi } from '@/api/base/baseApi'
import type { EntityId, PaginatedResponse } from '@/interfaces/base/common'
import type { IBaseService } from './BaseServiceInterface'

function unwrap<T>(response: { data: T } | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data
  }
  return response as T
}

/**
 * Service layer — wraps BaseApi, unwraps responses.
 * Mirrors backend BaseRepository usage from controllers.
 */
export class BaseService<T, CreateDto = Partial<T>, UpdateDto = Partial<T>>
  implements IBaseService<T, CreateDto, UpdateDto>
{
  constructor(protected readonly api: BaseApi) {}

  async all(): Promise<T[]> {
    const response = await this.api.all<T>()
    const data = unwrap(response)
    return Array.isArray(data) ? data : (data as PaginatedResponse<T>).data ?? []
  }

  async paginate(page = 1, perPage = 15): Promise<PaginatedResponse<T>> {
    const response = await this.api.paginate<T>(page, perPage)
    return unwrap(response)
  }

  async find(id: EntityId): Promise<T> {
    const response = await this.api.find<T>(id)
    return unwrap(response)
  }

  async create(data: CreateDto): Promise<T> {
    const response = await this.api.create<T, CreateDto>(data)
    return unwrap(response)
  }

  async update(id: EntityId, data: UpdateDto): Promise<T> {
    const response = await this.api.update<T, UpdateDto>(id, data)
    return unwrap(response)
  }

  async delete(id: EntityId): Promise<void> {
    await this.api.delete(id)
  }
}

export default BaseService
