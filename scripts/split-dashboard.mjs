import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '../src/pages/dashboard')
const src = fs.readFileSync(path.join(root, 'DashboardPage.tsx'), 'utf8')
const lines = src.split('\n')

function slice(start, end) {
  return lines.slice(start - 1, end).join('\n')
}

const dirs = [
  'data',
  'utils',
  'components',
  'views',
  'layout',
]

for (const d of dirs) {
  fs.mkdirSync(path.join(root, d), { recursive: true })
}

// types.ts
fs.writeFileSync(
  path.join(root, 'types.ts'),
  `export type ViewName =
  | 'dashboard'
  | 'machines'
  | 'workorders'
  | 'faults'
  | 'notifications'
  | 'repairs'
  | 'analytics'
  | 'finance'

${slice(16, 90)}
`
)

// constants.ts
fs.writeFileSync(
  path.join(root, 'constants.ts'),
  `import type { IssueCategory, WorkOrderStatus } from './types'

${slice(40, 49)}

${slice(396, 406)}
`
)

// seed.ts
fs.writeFileSync(
  path.join(root, 'data/seed.ts'),
  `import type {
  AppUser,
  FaultReport,
  Machine,
  Notification,
  RepairRecord,
  WorkOrder,
} from '../types'

${slice(94, 316)}
`
)

// formatters.ts
fs.writeFileSync(
  path.join(root, 'utils/formatters.ts'),
  slice(320, 335) + '\n'
)

// statusHelpers.tsx
fs.writeFileSync(
  path.join(root, 'utils/statusHelpers.tsx'),
  `import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Navigation,
  ShieldCheck,
  Truck,
  Wrench,
  XCircle,
} from 'lucide-react'
import type { FaultSeverity, MachineStatus, WorkOrderStatus } from '../types'

${slice(337, 394)}
`
)

// DashboardUI.tsx
fs.writeFileSync(
  path.join(root, 'components/DashboardUI.tsx'),
  `import type { ReactNode } from 'react'

${slice(410, 436)}
`
)

// views - extract function bodies only, add export
const viewSections = [
  ['DashboardView.tsx', 440, 580],
  ['MachineRegistryView.tsx', 583, 943],
  ['WorkOrdersView.tsx', 946, 1331],
  ['FaultReportsView.tsx', 1334, 1582],
  ['NotificationsView.tsx', 1585, 1628],
  ['PhotoLightbox.tsx', 1631, 1660, 'components'],
  ['RepairRecordsView.tsx', 1663, 1811],
  ['AnalyticsView.tsx', 1816, 1953],
  ['FinanceView.tsx', 1966, 2548],
]

for (const [name, start, end, folder = 'views'] of viewSections) {
  let body = slice(start, end)
  if (!body.startsWith('export ')) {
    body = body.replace(/^function /, 'export function ')
    body = body.replace(/^const /, 'export const ')
  }
  fs.writeFileSync(path.join(root, folder, name), body + '\n')
}

// layout components from main shell
const sidebarContent = `import {
  BarChart2,
  Bell,
  Camera,
  ChevronDown,
  ClipboardList,
  Cpu,
  Flag,
  LayoutDashboard,
  Receipt,
  User,
  Wrench,
} from 'lucide-react'
import { USERS } from '../data/seed'
import type { AppUser, UserRole, ViewName } from '../types'

export interface NavItem {
  id: ViewName
  label: string
  icon: React.ReactNode
  roles: UserRole[]
}

interface DashboardSidebarProps {
  view: ViewName
  currentUser: AppUser
  unreadCount: number
  openFaultCount: number
  navOpen: boolean
  showUserMenu: boolean
  onNavigate: (view: string, id?: string) => void
  onToggleUserMenu: () => void
  onSelectUser: (user: AppUser) => void
}

export function DashboardSidebar({
  view,
  currentUser,
  unreadCount,
  openFaultCount,
  navOpen,
  showUserMenu,
  onNavigate,
  onToggleUserMenu,
  onSelectUser,
}: DashboardSidebarProps) {
  const financeRoles: UserRole[] = ['Finance', 'Manager', 'Owner']

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, roles: [] },
    { id: 'machines', label: 'Machines', icon: <Cpu size={18} />, roles: [] },
    { id: 'workorders', label: 'Work Orders', icon: <ClipboardList size={18} />, roles: [] },
    { id: 'faults', label: 'Fault Reports', icon: <Flag size={18} />, roles: [] },
    { id: 'repairs', label: 'Repair Records', icon: <Camera size={18} />, roles: [] },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={18} />, roles: [] },
    { id: 'finance', label: 'Finance', icon: <Receipt size={18} />, roles: financeRoles },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, roles: [] },
  ]

  const visibleNav = navItems.filter(
    (n) => n.roles.length === 0 || n.roles.includes(currentUser.role)
  )

  return (
    <aside
      className={\`fixed inset-y-0 left-0 z-40 w-60 bg-primary flex flex-col transition-transform duration-200 \${navOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static\`}
    >
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-accent flex items-center justify-center shrink-0">
            <Wrench size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">MachineTrack</p>
            <p className="text-white/50 text-xs font-mono">Maintenance System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {visibleNav.map((n) => {
          const active = view === n.id
          const badge =
            n.id === 'notifications' && unreadCount > 0
              ? unreadCount
              : n.id === 'faults' && openFaultCount > 0
                ? openFaultCount
                : 0
          return (
            <button
              key={n.id}
              onClick={() => onNavigate(n.id)}
              className={\`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all \${active ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}\`}
            >
              {n.icon}
              {n.label}
              {badge > 0 && (
                <span
                  className={\`ml-auto text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center \${n.id === 'faults' ? 'bg-red-500' : 'bg-accent'}\`}
                >
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="relative">
          <button
            onClick={onToggleUserMenu}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center shrink-0">
              <User size={15} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{currentUser.name}</p>
              <p className="text-white/50 text-xs font-mono truncate">{currentUser.role}</p>
            </div>
            <ChevronDown size={14} className="text-white/50 shrink-0" />
          </button>
          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-card rounded-lg border border-border shadow-xl overflow-hidden z-50">
              <p className="text-xs font-mono text-muted-foreground px-3 pt-2 pb-1">
                Switch user (demo)
              </p>
              {USERS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => onSelectUser(u)}
                  className={\`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors \${currentUser.id === u.id ? 'text-primary font-semibold' : 'text-foreground'}\`}
                >
                  <User size={13} className="text-muted-foreground" />
                  <span className="flex-1 text-left">{u.name}</span>
                  <span className="text-xs text-muted-foreground font-mono">{u.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
`

fs.writeFileSync(path.join(root, 'layout/DashboardSidebar.tsx'), sidebarContent)

const headerContent = `import { Bell } from 'lucide-react'
import type { AppUser, ViewName } from '../types'

const viewLabels: Record<ViewName, string> = {
  dashboard: 'Dashboard',
  machines: 'Machines',
  workorders: 'Work Orders',
  faults: 'Fault Reports',
  notifications: 'Notifications',
  repairs: 'Repair Records',
  analytics: 'Analytics — 2024',
  finance: 'Finance',
}

interface DashboardHeaderProps {
  view: ViewName
  currentUser: AppUser
  unreadCount: number
  onOpenNav: () => void
  onNavigate: (view: string, id?: string) => void
}

export function DashboardHeader({
  view,
  currentUser,
  unreadCount,
  onOpenNav,
  onNavigate,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-card border-b border-border px-5 py-3.5 flex items-center gap-4">
      <button
        className="lg:hidden text-muted-foreground hover:text-foreground"
        onClick={onOpenNav}
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
      </button>
      <div>
        <h1 className="text-base font-bold text-foreground leading-tight">{viewLabels[view]}</h1>
        <p className="text-xs text-muted-foreground font-mono">
          {currentUser.site} · {currentUser.role}
        </p>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="text-xs text-muted-foreground hidden sm:block font-mono">
          {currentUser.name}
        </span>
        <button
          onClick={() => onNavigate('notifications')}
          className="relative w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <Bell size={17} className="text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-accent rounded-full text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
`

fs.writeFileSync(path.join(root, 'layout/DashboardHeader.tsx'), headerContent)

console.log('Split complete. Run fix-dashboard-imports next.')
