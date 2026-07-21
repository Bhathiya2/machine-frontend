import { Link, useLocation } from 'react-router'
import {
  BarChart2,
  Bell,
  Camera,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Cpu,
  Flag,
  LayoutDashboard,
  LogOut,
  Receipt,
  Shield,
  Users,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuthContext } from '@/context/AuthContext'
import { usePermissions } from '@/hooks/permission/usePermissions'
import { VIEW_ROUTES } from '../constants'
import { PERMISSIONS, type Permission } from '../permissions'
import type { DashboardSidebarState } from '@/hooks/dashboard/useDashboardSidebar'
import type { AppUser, ViewName } from '../types'
import { cn } from '@/components/ui/utils'

interface NavItem {
  id: ViewName
  label: string
  icon: LucideIcon
  permission?: Permission
}

interface NavSection {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: PERMISSIONS.DASHBOARD_VIEW }],
  },
  {
    title: 'Operations',
    items: [
      { id: 'machines', label: 'Machines', icon: Cpu, permission: PERMISSIONS.MACHINES_VIEW },
      { id: 'workorders', label: 'Work Orders', icon: ClipboardList, permission: PERMISSIONS.WORKORDERS_VIEW },
      { id: 'faults', label: 'Fault Reports', icon: Flag, permission: PERMISSIONS.FAULTS_VIEW },
      { id: 'repairs', label: 'Repair Records', icon: Camera, permission: PERMISSIONS.REPAIRS_VIEW },
    ],
  },
  {
    title: 'Insights',
    items: [
      { id: 'analytics', label: 'Analytics', icon: BarChart2, permission: PERMISSIONS.ANALYTICS_VIEW },
      { id: 'finance', label: 'Finance', icon: Receipt, permission: PERMISSIONS.FINANCE_VIEW },
    ],
  },
  {
    title: 'System',
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell, permission: PERMISSIONS.NOTIFICATIONS_VIEW },
      { id: 'users', label: 'User Management', icon: Users, permission: PERMISSIONS.USERS_VIEW },
      { id: 'roles', label: 'Roles & Permissions', icon: Shield, permission: PERMISSIONS.ROLES_VIEW },
    ],
  },
]

function getBadge(id: ViewName, unreadCount: number, openFaultCount: number) {
  if (id === 'notifications' && unreadCount > 0) return unreadCount
  if (id === 'faults' && openFaultCount > 0) return openFaultCount
  return 0
}

function userInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

interface DashboardSidebarProps {
  currentUser: AppUser
  unreadCount: number
  openFaultCount: number
  sidebar: DashboardSidebarState
}

export function DashboardSidebar({
  currentUser,
  unreadCount,
  openFaultCount,
  sidebar,
}: DashboardSidebarProps) {
  const location = useLocation()
  const { logout } = useAuthContext()
  const { can } = usePermissions()
  const {
    collapsed,
    toggleCollapsed,
    mobileNavOpen,
    closeMobileNav,
    isDesktop,
  } = sidebar

  const isCollapsed = isDesktop && collapsed

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.permission || can(item.permission)),
  })).filter((section) => section.items.length > 0)

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col bg-primary text-primary-foreground transition-all duration-300 lg:sticky lg:top-0 lg:h-screen',
        isCollapsed ? 'w-[72px]' : 'w-64',
        mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Brand */}
      <div className={cn('flex items-center gap-3 border-b border-white/10 px-4 py-4', isCollapsed && 'justify-center px-2')}>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
          <Wrench className="size-4" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold tracking-tight">Maintenance Tracker</p>
            <p className="truncate text-[10px] font-mono text-primary-foreground/50">Operations Hub</p>
          </div>
        )}
        {isDesktop && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              'ml-auto rounded-lg p-1.5 text-primary-foreground/60 hover:bg-white/10 hover:text-primary-foreground',
              isCollapsed && 'ml-0'
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {visibleSections.map((section) => (
          <div key={section.title} className="mb-5">
            {!isCollapsed && (
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/40">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const path = VIEW_ROUTES[item.id]
                const active = location.pathname === path
                const badge = getBadge(item.id, unreadCount, openFaultCount)
                const Icon = item.icon

                return (
                  <li key={item.id}>
                    <Link
                      to={path}
                      onClick={closeMobileNav}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-colors',
                        active
                          ? 'bg-white text-primary shadow-sm'
                          : 'text-primary-foreground/75 hover:bg-white/10 hover:text-primary-foreground',
                        isCollapsed && 'justify-center px-2'
                      )}
                    >
                      <Icon className={cn('size-[18px] shrink-0', active ? 'text-primary' : 'text-primary-foreground/70')} />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {badge > 0 && (
                            <span
                              className={cn(
                                'flex size-5 items-center justify-center rounded-full text-[10px] font-bold',
                                active ? 'bg-primary/10 text-primary' : 'bg-white/15 text-white'
                              )}
                            >
                              {badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div
          className={cn(
            'flex items-center gap-2.5 rounded-xl px-2.5 py-2.5',
            isCollapsed && 'justify-center px-2'
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white ring-1 ring-white/20">
            {userInitials(currentUser.name)}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{currentUser.name}</p>
              <p className="truncate text-[10px] font-mono text-primary-foreground/50">{currentUser.role}</p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <button
            type="button"
            onClick={() => logout()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-primary-foreground/80 transition-colors hover:bg-white/10"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        )}
      </div>
    </aside>
  )
}
