import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/pages/dashboard')

const preambles = {
  'views/DashboardView.tsx': `import { AlertTriangle, ChevronRight, Flag } from 'lucide-react'
import { Badge, Card } from '../components/DashboardUI'
import { fmtCurrency, formatDate } from '../utils/formatters'
import { machineStatusIcon, statusColor, woStatusColor, woStatusIcon } from '../utils/statusHelpers'
import type { FaultReport, Machine, RepairRecord, WorkOrder } from '../types'

`,
  'views/MachineRegistryView.tsx': `import { useMemo, useState } from 'react'
import { Calendar, ChevronRight, Cpu, Flag, MapPin, Plus, Search, ShieldAlert, ShieldCheck, Wrench, X } from 'lucide-react'
import { ISSUE_CATEGORIES, SITES } from '../constants'
import { Badge, Card, FormField, inputCls, selectCls } from '../components/DashboardUI'
import { formatDate, fmtCurrency, warrantyStatus } from '../utils/formatters'
import { machineStatusIcon, severityColor, statusColor, woStatusColor } from '../utils/statusHelpers'
import type { AppUser, FaultReport, FaultSeverity, IssueCategory, Machine, RepairRecord, WorkOrder } from '../types'

`,
  'views/WorkOrdersView.tsx': `import { useState } from 'react'
import { ChevronRight, Clock, DollarSign, FileText, Plus, Truck, Wrench, X } from 'lucide-react'
import { WO_FLOW } from '../constants'
import { Badge, Card, FormField, inputCls, selectCls } from '../components/DashboardUI'
import { formatDate, fmtCurrency } from '../utils/formatters'
import { priorityColor, woStatusColor, woStatusIcon } from '../utils/statusHelpers'
import type { AppUser, FaultReport, Machine, Notification, WorkOrder, WorkOrderStatus } from '../types'

`,
  'views/FaultReportsView.tsx': `import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, ChevronRight, Flag, Plus, Search, X } from 'lucide-react'
import { ISSUE_CATEGORIES } from '../constants'
import { Badge, Card, FormField, inputCls, selectCls } from '../components/DashboardUI'
import { formatDate } from '../utils/formatters'
import { severityColor } from '../utils/statusHelpers'
import type { AppUser, FaultReport, FaultSeverity, IssueCategory, Machine, Notification, WorkOrder } from '../types'

`,
  'views/NotificationsView.tsx': `import { Bell, ChevronRight } from 'lucide-react'
import { Card } from '../components/DashboardUI'
import { formatDate } from '../utils/formatters'
import type { AppUser, Notification } from '../types'

`,
  'components/PhotoLightbox.tsx': `import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { RepairPhoto } from '../types'

`,
  'views/RepairRecordsView.tsx': `import { useMemo, useState } from 'react'
import { Camera, ChevronRight, Package } from 'lucide-react'
import { CATEGORY_COLORS } from '../constants'
import { PhotoLightbox } from '../components/PhotoLightbox'
import { Card } from '../components/DashboardUI'
import { formatDate, fmtCurrency } from '../utils/formatters'
import type { AppUser, Machine, RepairPhoto, RepairRecord } from '../types'

`,
  'views/AnalyticsView.tsx': `import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { CATEGORY_COLORS } from '../constants'
import { ChartTooltip } from '../components/ChartTooltip'
import { Card } from '../components/DashboardUI'
import { formatDate, fmtCurrency } from '../utils/formatters'
import type { IssueCategory, Machine, RepairRecord } from '../types'

`,
  'views/FinanceView.tsx': `import { useMemo, useState } from 'react'
import { DollarSign, Pencil, Plus, Receipt, Search } from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { ChartTooltip } from '../components/ChartTooltip'
import { Badge, Card, FormField, inputCls, selectCls } from '../components/DashboardUI'
import { formatDate, fmtCurrency } from '../utils/formatters'
import { woStatusColor, woStatusIcon } from '../utils/statusHelpers'
import type { AppUser, CostCategory, CostEntry, Machine, RepairRecord, WorkOrder } from '../types'

`,
}

for (const [rel, preamble] of Object.entries(preambles)) {
  const filePath = path.join(root, rel)
  let content = fs.readFileSync(filePath, 'utf8')

  // strip old export from Analytics if CustomTooltip at top
  if (rel === 'views/AnalyticsView.tsx') {
    content = content.replace(/^export const CustomTooltip[\s\S]*?\};\n\n/, '')
    content = content.replace(/^function AnalyticsView/, 'export function AnalyticsView')
    content = content.replace(/<CustomTooltip/g, '<ChartTooltip')
  }

  if (rel === 'views/FinanceView.tsx') {
    content = content.replace(/<CustomTooltip/g, '<ChartTooltip')
  }

  if (rel === 'components/PhotoLightbox.tsx') {
    content = content.replace(/^function PhotoLightbox/, 'export function PhotoLightbox')
  }

  if (!content.startsWith('import ')) {
    fs.writeFileSync(filePath, preamble + content)
  }
}

console.log('Imports added.')
