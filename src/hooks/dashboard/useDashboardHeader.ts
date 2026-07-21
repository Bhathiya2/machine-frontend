import { useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router'
import {
  useClickOutside,
  useDisclosure,
  useDocumentTitle,
  useDocumentVisibility,
  useHotkeys,
  useOnlineStatus,
  useSearch,
} from '@/hooks/base/commonHooks'
import { VIEW_LABELS, VIEW_ROUTES } from '@/pages/dashboard/constants'
import type { AppUser, FaultReport, Machine, ViewName, WorkOrder } from '@/pages/dashboard/types'

export interface DashboardSearchItem extends Record<string, unknown> {
  id: string
  label: string
  subtitle: string
  path: string
  type: 'Machine' | 'Work Order' | 'Fault' | 'User'
}

interface DashboardHeaderData {
  machines: Machine[]
  workOrders: WorkOrder[]
  faultReports: FaultReport[]
  users: AppUser[]
}

export function useDashboardHeader(view: ViewName, data: DashboardHeaderData) {
  const navigate = useNavigate()
  const searchRef = useRef<HTMLInputElement>(null)
  const searchPanel = useDisclosure(false)

  const searchPanelRef = useClickOutside<HTMLDivElement>(() => {
    searchPanel.close()
  })

  const isOnline = useOnlineStatus()
  const visibility = useDocumentVisibility()
  const isAway = visibility === 'hidden'

  useDocumentTitle(`${VIEW_LABELS[view]} · MachineTrack`)

  const searchItems = useMemo<DashboardSearchItem[]>(() => {
    const machineItems: DashboardSearchItem[] = data.machines.map((machine) => ({
      id: machine.id,
      label: machine.name,
      subtitle: `${machine.site} · ${machine.status}`,
      path: `${VIEW_ROUTES.machines}?focus=${encodeURIComponent(machine.id)}`,
      type: 'Machine',
    }))

    const workOrderItems: DashboardSearchItem[] = data.workOrders.map((order) => ({
      id: order.id,
      label: order.title,
      subtitle: `${order.status} · ${order.priority} priority`,
      path: `${VIEW_ROUTES.workorders}?focus=${encodeURIComponent(order.id)}`,
      type: 'Work Order',
    }))

    const faultItems: DashboardSearchItem[] = data.faultReports.map((fault) => ({
      id: fault.id,
      label: fault.description.slice(0, 72),
      subtitle: `${fault.severity} · ${fault.status}`,
      path: `${VIEW_ROUTES.faults}?focus=${encodeURIComponent(fault.id)}`,
      type: 'Fault',
    }))

    const userItems: DashboardSearchItem[] = data.users.map((user) => ({
      id: user.id,
      label: user.name,
      subtitle: `${user.role} · ${user.site}`,
      path: `${VIEW_ROUTES.users}?focus=${encodeURIComponent(user.id)}`,
      type: 'User',
    }))

    return [...machineItems, ...workOrderItems, ...faultItems, ...userItems]
  }, [data.machines, data.workOrders, data.faultReports, data.users])

  const { query, setQuery, results, isSearching } = useSearch(searchItems, {
    keys: ['label', 'subtitle', 'type'],
    debounceMs: 250,
  })

  const openSearch = useCallback(() => {
    searchRef.current?.focus()
    searchPanel.open()
  }, [searchPanel])

  const closeSearch = useCallback(() => {
    searchPanel.close()
    setQuery('')
    searchRef.current?.blur()
  }, [searchPanel, setQuery])

  const hotkeys = useMemo(
    () => ({
      'ctrl+k': () => openSearch(),
      escape: () => {
        if (searchPanel.isOpen || query) closeSearch()
      },
    }),
    [closeSearch, openSearch, query, searchPanel.isOpen]
  )

  useHotkeys(hotkeys)

  const selectSearchResult = useCallback(
    (item: DashboardSearchItem) => {
      navigate(item.path)
      setQuery('')
      searchPanel.close()
    },
    [navigate, searchPanel, setQuery]
  )

  return {
    isOnline,
    isAway,
    searchRef,
    searchPanelRef,
    searchPanelOpen: searchPanel.isOpen,
    openSearch,
    closeSearch,
    searchQuery: query,
    setSearchQuery: setQuery,
    searchResults: results.slice(0, 8),
    isSearching,
    selectSearchResult,
    showSearchResults: query.length > 0,
  }
}

export type DashboardHeaderState = ReturnType<typeof useDashboardHeader>
