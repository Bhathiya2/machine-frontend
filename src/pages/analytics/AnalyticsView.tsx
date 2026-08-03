import { useMemo, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { CATEGORY_COLORS, MONTHS } from '@/pages/dashboard/constants'
import { ChartTooltip } from '@/pages/dashboard/components/ChartTooltip'
import { Card } from '@/pages/dashboard/components/DashboardUI'
import { formatDate, fmtCurrency } from '@/pages/dashboard/utils/formatters'
import type { IssueCategory, Machine, RepairRecord } from '@/pages/dashboard/types'

export function AnalyticsView({ repairRecords, machines }: { repairRecords: RepairRecord[]; machines: Machine[] }) {
  const availableYears = useMemo(() => {
    const current = new Date().getFullYear()
    const years = new Set<number>([current])
    for (const record of repairRecords) {
      const year = Number(record.date.slice(0, 4))
      if (!Number.isNaN(year) && year > 2000) years.add(year)
    }
    return [...years].sort((a, b) => b - a)
  }, [repairRecords])

  const [year, setYear] = useState(() => availableYears[0] ?? new Date().getFullYear())
  const activeYear = availableYears.includes(year) ? year : (availableYears[0] ?? year)
  const yearRecords = repairRecords.filter((r) => r.date.startsWith(String(activeYear)))
  const totalCost = yearRecords.reduce((s, r) => s + r.totalCost, 0)
  const totalRepairs = yearRecords.length
  const avgCost = totalRepairs ? Math.round(totalCost / totalRepairs) : 0
  const uniqueMachines = new Set(yearRecords.map((r) => r.machineId)).size
  const monthlyData = MONTHS.map((month, i) => {
    const mo = String(i + 1).padStart(2, '0')
    const recs = yearRecords.filter((r) => r.date.startsWith(`${activeYear}-${mo}`))
    return { month, cost: recs.reduce((s, r) => s + r.totalCost, 0), repairs: recs.length }
  })
  const machineData = machines.map((m) => {
    const recs = yearRecords.filter((r) => r.machineId === m.id)
    return { machine: m.id, repairs: recs.length, cost: recs.reduce((s, r) => s + r.totalCost, 0) }
  }).sort((a, b) => b.repairs - a.repairs)
  const categories: IssueCategory[] = ['Mechanical', 'Electrical', 'Software / Firmware', 'Hydraulic', 'Preventive Maintenance']
  const categoryData = categories.map((cat) => {
    const recs = yearRecords.filter((r) => r.issueCategory === cat)
    return { name: cat, value: recs.length, cost: recs.reduce((s, r) => s + r.totalCost, 0) }
  }).filter((c) => c.value > 0)
  const issueTable = [...yearRecords].sort((a, b) => b.totalCost - a.totalCost)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center"><TrendingUp size={16} className="text-primary" /></div>
          <div>
            <h2 className="font-bold text-foreground text-lg leading-tight">Annual Report — {activeYear}</h2>
            <p className="text-xs font-mono text-muted-foreground">All Sites · Year-End Summary</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={String(activeYear)}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 px-3 py-1.5 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
          >
            {availableYears.map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
          <span className="text-xs font-mono px-3 py-1.5 bg-primary text-white rounded-lg">FY {activeYear}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5"><p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Total Repairs</p><p className="text-3xl font-bold text-primary mt-1">{totalRepairs}</p><p className="text-xs text-muted-foreground mt-1">Work orders completed</p></Card>
        <Card className="p-5"><p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Machines Repaired</p><p className="text-3xl font-bold text-foreground mt-1">{uniqueMachines}</p><p className="text-xs text-muted-foreground mt-1">of {machines.length} in fleet</p></Card>
        <Card className="p-5"><p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Total Cost</p><p className="text-3xl font-bold text-foreground mt-1">{fmtCurrency(totalCost)}</p><p className="text-xs text-muted-foreground mt-1">Parts + labor</p></Card>
        <Card className="p-5"><p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Avg Cost / Repair</p><p className="text-3xl font-bold text-foreground mt-1">{fmtCurrency(avgCost)}</p><p className="text-xs text-muted-foreground mt-1">Per incident</p></Card>
      </div>
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-border"><h3 className="font-semibold text-foreground">Monthly Repair Cost Trend</h3><p className="text-xs text-muted-foreground font-mono mt-0.5">Total spend per month — {activeYear}</p></div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => v === 0 ? '৳0' : `৳${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fill: '#6B7280' }} axisLine={false} tickLine={false} width={44} />
              <Tooltip content={<ChartTooltip />} />
              <Bar key="cost" dataKey="cost" name="Repair Cost" fill="#F59E0B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 overflow-hidden">
          <div className="px-5 py-4 border-b border-border"><h3 className="font-semibold text-foreground">Repair Frequency by Machine</h3></div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={machineData} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="machine" width={72} tick={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fill: '#1A2942', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar key="repairs" dataKey="repairs" name="Repairs" fill="#1A2942" radius={[0, 3, 3, 0]} label={{ position: 'right', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fill: '#6B7280', formatter: (v: number) => v > 0 ? v : '' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="px-5 py-4 border-b border-border"><h3 className="font-semibold text-foreground">Issue Categories</h3><p className="text-xs text-muted-foreground font-mono mt-0.5">By repair count</p></div>
          <div className="p-4 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                  {categoryData.map((entry) => <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name as IssueCategory]} />)}
                </Pie>
                <Tooltip formatter={(v: number, name: string) => [v + ' repairs', name]} contentStyle={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', background: '#1A2942', border: 'none', borderRadius: 8, color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 w-full mt-2">
              {categoryData.map((c) => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: CATEGORY_COLORS[c.name as IssueCategory] }} />
                  <span className="text-xs text-foreground flex-1 truncate">{c.name}</span>
                  <span className="text-xs font-mono text-muted-foreground">{c.value}x</span>
                  <span className="text-xs font-mono text-foreground">{fmtCurrency(c.cost)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-border"><h3 className="font-semibold text-foreground">Repair Log — {activeYear}</h3><p className="text-xs text-muted-foreground font-mono mt-0.5">All completed repair records, sorted by cost</p></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/40">
              <th className="text-left px-5 py-2.5 text-xs font-mono text-muted-foreground uppercase tracking-wider">Record</th>
              <th className="text-left px-3 py-2.5 text-xs font-mono text-muted-foreground uppercase tracking-wider">Machine</th>
              <th className="text-left px-3 py-2.5 text-xs font-mono text-muted-foreground uppercase tracking-wider hidden md:table-cell">Category</th>
              <th className="text-left px-3 py-2.5 text-xs font-mono text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Issue</th>
              <th className="text-left px-3 py-2.5 text-xs font-mono text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="text-right px-5 py-2.5 text-xs font-mono text-muted-foreground uppercase tracking-wider">Cost</th>
            </tr></thead>
            <tbody className="divide-y divide-border">
              {issueTable.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{r.id}</td>
                  <td className="px-3 py-3"><p className="font-mono text-xs font-semibold text-primary">{r.machineId}</p><p className="text-xs text-muted-foreground truncate max-w-[100px]">{machines.find((m) => m.id === r.machineId)?.site}</p></td>
                  <td className="px-3 py-3 hidden md:table-cell"><span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: CATEGORY_COLORS[r.issueCategory] + '18', color: CATEGORY_COLORS[r.issueCategory] }}>{r.issueCategory}</span></td>
                  <td className="px-3 py-3 hidden lg:table-cell max-w-[220px]"><p className="text-xs text-foreground truncate">{r.issueDescription.slice(0, 70)}…</p></td>
                  <td className="px-3 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">{formatDate(r.date)}</td>
                  <td className="px-5 py-3 text-right font-mono text-sm font-semibold text-foreground">{fmtCurrency(r.totalCost)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="border-t-2 border-border bg-muted/30"><td colSpan={5} className="px-5 py-3 text-xs font-mono font-semibold text-foreground uppercase tracking-wider">Total</td><td className="px-5 py-3 text-right font-mono font-bold text-foreground">{fmtCurrency(totalCost)}</td></tr></tfoot>
          </table>
        </div>
      </Card>
    </div>
  )
}
