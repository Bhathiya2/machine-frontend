import { useCallback, useMemo } from 'react'
import {
  useClickOutside,
  useDisclosure,
  useHotkeys,
  useLocalStorage,
  useMediaQuery,
  useScrollLock,
  useUpdateEffect,
} from '@/hooks/base/commonHooks'

const DESKTOP_QUERY = '(min-width: 1024px)'
const COLLAPSED_KEY = 'dashboard.sidebar.collapsed'

export function useDashboardSidebar() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const mobileNav = useDisclosure(false)
  const userMenu = useDisclosure(false)
  const [collapsed, setCollapsed] = useLocalStorage<boolean>(COLLAPSED_KEY, false)

  useScrollLock(mobileNav.isOpen && !isDesktop)

  useUpdateEffect(() => {
    if (isDesktop) mobileNav.close()
  }, [isDesktop, mobileNav])

  const userMenuRef = useClickOutside<HTMLDivElement>(() => {
    if (userMenu.isOpen) userMenu.close()
  })

  const closeMobileNav = useCallback(() => {
    if (!isDesktop) mobileNav.close()
  }, [isDesktop, mobileNav])

  const openMobileNav = useCallback(() => {
    mobileNav.open()
  }, [mobileNav])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [setCollapsed])

  const closeUserMenu = useCallback(() => {
    userMenu.close()
  }, [userMenu])

  const toggleUserMenu = useCallback(() => {
    userMenu.toggle()
  }, [userMenu])

  const hotkeys = useMemo(
    () => ({
      escape: () => {
        if (mobileNav.isOpen) mobileNav.close()
        else if (userMenu.isOpen) userMenu.close()
      },
      'ctrl+b': () => {
        if (isDesktop) toggleCollapsed()
      },
    }),
    [isDesktop, mobileNav, toggleCollapsed, userMenu]
  )

  useHotkeys(hotkeys)

  return {
    isDesktop,
    collapsed,
    setCollapsed,
    toggleCollapsed,
    mobileNavOpen: mobileNav.isOpen,
    openMobileNav,
    closeMobileNav,
    userMenuOpen: userMenu.isOpen,
    toggleUserMenu,
    closeUserMenu,
    userMenuRef,
  }
}

export type DashboardSidebarState = ReturnType<typeof useDashboardSidebar>
