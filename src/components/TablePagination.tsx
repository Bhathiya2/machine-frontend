import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const TABLE_PAGE_SIZE_OPTIONS = [3, 5, 10, 20] as const

export type TablePaginationOptions = {
  pageSize?: number
  pageSizeOptions?: readonly number[]
  resetKey?: unknown
}

export type TablePaginationResult<T> = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  startIndex: number
  endIndex: number
  pageItems: T[]
  pageNumbers: number[]
  setPage: Dispatch<SetStateAction<number>>
  setPageSize: (size: number) => void
  nextPage: () => void
  prevPage: () => void
  hasNext: boolean
  hasPrev: boolean
}

function getPageNumbers(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set<number>([1, total, current, current - 1, current + 1])
  return [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
}

export function useTablePagination<T>(
  items: T[],
  options: TablePaginationOptions = {}
): TablePaginationResult<T> {
  const {
    pageSize: initialPageSize = 5,
    resetKey,
  } = options

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  useEffect(() => {
    setPage(1)
  }, [resetKey, pageSize])

  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1)
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage)
  }, [page, currentPage])

  const pageItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  )

  const pageNumbers = useMemo(
    () => getPageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  )

  return {
    page: currentPage,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    pageItems,
    pageNumbers,
    setPage,
    setPageSize: (size: number) => setPageSize(size),
    nextPage: () => setPage((p) => Math.min(totalPages, p + 1)),
    prevPage: () => setPage((p) => Math.max(1, p - 1)),
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  }
}

type TablePaginationBarProps = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  startIndex: number
  endIndex: number
  pageNumbers: number[]
  pageSizeOptions?: readonly number[]
  disabled?: boolean
  onPageChange: Dispatch<SetStateAction<number>>
  onPageSizeChange: (size: number) => void
  label?: string
}

export function TablePaginationBar({
  page,
  pageSize,
  totalItems,
  totalPages,
  startIndex,
  endIndex,
  pageNumbers,
  pageSizeOptions = TABLE_PAGE_SIZE_OPTIONS,
  disabled = false,
  onPageChange,
  onPageSizeChange,
  label = 'item(s)',
}: TablePaginationBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
        <span>
          {totalItems === 0
            ? `0 ${label}`
            : `Showing ${startIndex + 1}–${endIndex} of ${totalItems}`}
        </span>
        <label className="flex items-center gap-2">
          <span className="text-xs">Per page</span>
          <select
            className="h-8 rounded-md border border-border bg-card px-2 text-xs"
            value={pageSize}
            disabled={disabled}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1 || disabled}
        >
          <ChevronLeft size={16} />
          Prev
        </Button>

        {pageNumbers.map((num, index) => {
          const prev = pageNumbers[index - 1]
          const showEllipsis = prev !== undefined && num - prev > 1
          return (
            <span key={num} className="flex items-center gap-1">
              {showEllipsis && <span className="px-1 text-muted-foreground">…</span>}
              <Button
                variant={num === page ? 'default' : 'outline'}
                size="sm"
                className="h-8 min-w-8 px-2 font-mono"
                onClick={() => onPageChange(num)}
                disabled={disabled}
              >
                {num}
              </Button>
            </span>
          )
        })}

        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || disabled}
        >
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}
