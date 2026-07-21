import { useMemo, useState, useEffect } from 'react'
import { DollarSign, Pencil, Plus, Receipt, Search, X } from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { COST_CATEGORIES, COST_CATEGORY_META, MONTHS } from '@/pages/dashboard/constants'
import { PERMISSIONS } from '@/pages/dashboard/permissions'
import { usePermissions } from '@/hooks/permission/usePermissions'
import { TablePaginationBar, useTablePagination } from '@/components/TablePagination'
import { ChartTooltip } from '@/pages/dashboard/components/ChartTooltip'
import { Badge, Card, FormField, inputCls, selectCls } from '@/pages/dashboard/components/DashboardUI'
import { formatDate, fmtCurrency } from '@/pages/dashboard/utils/formatters'
import { woStatusColor, woStatusIcon } from '@/pages/dashboard/utils/statusHelpers'
import type { AppUser, CostCategory, CostEntry, Machine, RepairRecord, WorkOrder } from '@/pages/dashboard/types'

export function FinanceView({
  repairRecords, workOrders, machines, users, currentUser, onUpdateCosts,
}: {
  repairRecords: RepairRecord[]; workOrders: WorkOrder[];
  machines: Machine[];
  users: AppUser[]; currentUser: AppUser;
  onUpdateCosts: (dbId: number, entries: CostEntry[]) => Promise<WorkOrder | null>;
}) {
  const [localWorkOrders, setLocalWorkOrders] = useState(workOrders)
  const [selectedWOId, setSelectedWOId] = useState<string | null>(workOrders[0]?.id ?? null)
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(() => String(new Date().getMonth() + 1).padStart(2, "0"));
  
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CostEntry | null>(null);
  const [editForm, setEditForm] = useState<{ category: CostCategory; quantity: string; unitPrice: string; details: string; date: string }>({
    category: "Spare Part", quantity: "1", unitPrice: "", details: "", date: "",
  });
  const [addDate, setAddDate] = useState(() => new Date().toISOString().split("T")[0]);
  
  type PosRow = { id: string; category: CostCategory; quantity: string; unitPrice: string; details: string };
  const [posRows, setPosRows] = useState<PosRow[]>([]);
  
  const [woSearch, setWoSearch] = useState("");

  const { can } = usePermissions()
  const canEdit = can(PERMISSIONS.FINANCE_EDIT)

  const selectedWO = localWorkOrders.find((w) => w.id === selectedWOId) ?? null;
  const getMachine = (id: string) => machines.find((m) => m.id === id);
  const getUserName = (id: string) => users.find((u) => u.id === id)?.name ?? id;

  useEffect(() => {
    setLocalWorkOrders(workOrders)
  }, [workOrders])

  const woTotal = (wo: WorkOrder) => {
    const ym = `${selectedYear}-${selectedMonth}`;
    return wo.costEntries.filter(e => e.date.startsWith(ym)).reduce((s, e) => s + e.amount, 0);
  };
  const catTotal = (wo: WorkOrder, cat: CostCategory) => {
    const ym = `${selectedYear}-${selectedMonth}`;
    return wo.costEntries.filter((e) => e.category === cat && e.date.startsWith(ym)).reduce((s, e) => s + e.amount, 0);
  };

  const currentMonthEntriesCount = useMemo(() => {
    const ym = `${selectedYear}-${selectedMonth}`;
    return localWorkOrders.flatMap((w) => w.costEntries).filter(e => e.date.startsWith(ym)).length;
  }, [localWorkOrders, selectedYear, selectedMonth]);

  const grandTotals = useMemo(() => {
    const ym = `${selectedYear}-${selectedMonth}`;
    const all = localWorkOrders.flatMap((w) => w.costEntries).filter(e => e.date.startsWith(ym));
    return {
      transportation: all.filter((e) => e.category === "Transportation").reduce((s, e) => s + e.amount, 0),
      accommodation:  all.filter((e) => e.category === "Accommodation").reduce((s, e) => s + e.amount, 0),
      labor:          all.filter((e) => e.category === "Labor").reduce((s, e) => s + e.amount, 0),
      sparePart:      all.filter((e) => e.category === "Spare Part").reduce((s, e) => s + e.amount, 0),
      others:         all.filter((e) => e.category === "Others").reduce((s, e) => s + e.amount, 0),
      grand:          all.reduce((s, e) => s + e.amount, 0),
    };
  }, [localWorkOrders, selectedYear, selectedMonth]);

  const monthlyChartData = useMemo(() => {
    return MONTHS.map((month, mi) => {
      const mo = String(mi + 1).padStart(2, "0");
      const entries = localWorkOrders.flatMap((w) =>
        w.costEntries.filter((e) => e.date.startsWith(`${selectedYear}-${mo}`))
      );
      return {
        month,
        Transportation: entries.filter((e) => e.category === "Transportation").reduce((s, e) => s + e.amount, 0),
        Accommodation:  entries.filter((e) => e.category === "Accommodation").reduce((s, e) => s + e.amount, 0),
        Labor:          entries.filter((e) => e.category === "Labor").reduce((s, e) => s + e.amount, 0),
        "Spare Part":   entries.filter((e) => e.category === "Spare Part").reduce((s, e) => s + e.amount, 0),
        Others:         entries.filter((e) => e.category === "Others").reduce((s, e) => s + e.amount, 0),
      };
    });
  }, [localWorkOrders, selectedYear]);

  const filteredWOs = useMemo(() => {
    const q = woSearch.toLowerCase();
    const ym = `${selectedYear}-${selectedMonth}`;
    return localWorkOrders.filter((w) => {
      const matchesSearch = w.id.toLowerCase().includes(q) || w.machineId.toLowerCase().includes(q) || w.title.toLowerCase().includes(q);
      const matchesMonth = w.createdAt.startsWith(ym) || w.updatedAt.startsWith(ym) || w.costEntries.some(e => e.date.startsWith(ym));
      return matchesSearch && matchesMonth;
    });
  }, [localWorkOrders, woSearch, selectedYear, selectedMonth]);

  const pagination = useTablePagination(filteredWOs, {
    pageSize: 5,
    resetKey: `${woSearch}|${selectedYear}|${selectedMonth}`,
  })
  const { pageItems } = pagination

  const openAdd = () => {
    setEditingEntry(null);
    setAddDate(new Date().toISOString().split("T")[0]);
    setPosRows([{ id: `r-${Date.now()}`, category: "Spare Part", quantity: "1", unitPrice: "", details: "" }]);
    setShowEntryModal(true);
  };

  const openEdit = (entry: CostEntry) => {
    setEditingEntry(entry);
    setEditForm({ 
      category: entry.category, 
      quantity: String(entry.quantity || 1), 
      unitPrice: String(entry.unitPrice || entry.amount), 
      details: entry.details || "",
      date: entry.date 
    });
    setShowEntryModal(true);
  };

  const saveEntry = async () => {
    if (!selectedWO?.dbId) return;

    if (editingEntry) {
      if (!editForm.quantity || !editForm.unitPrice) return;
      const qty = parseFloat(editForm.quantity);
      const up = parseFloat(editForm.unitPrice);
      if (isNaN(qty) || qty <= 0 || isNaN(up) || up < 0) return;
      const amt = qty * up;

      const nextEntries = selectedWO.costEntries.map((e) =>
        e.id === editingEntry.id
          ? { ...e, category: editForm.category, amount: amt, quantity: qty, unitPrice: up, details: editForm.details.trim(), date: editForm.date }
          : e
      );
      const updated = await onUpdateCosts(selectedWO.dbId, nextEntries);
      if (!updated) return;
    } else {
      const newCostEntries: CostEntry[] = [];
      let timeOffset = 0;
      posRows.forEach((row) => {
        const qty = parseFloat(row.quantity);
        const up = parseFloat(row.unitPrice);
        if (!isNaN(qty) && qty > 0 && !isNaN(up) && up > 0) {
          newCostEntries.push({
            id: `ce-${Date.now()}-${timeOffset++}`, category: row.category,
            amount: qty * up, quantity: qty, unitPrice: up, details: row.details.trim(), date: addDate,
          });
        }
      });
      if (newCostEntries.length === 0) return;

      const nextEntries = [...selectedWO.costEntries, ...newCostEntries];
      const updated = await onUpdateCosts(selectedWO.dbId, nextEntries);
      if (!updated) return;
    }
    setShowEntryModal(false);
  };

  const deleteEntry = async (entryId: string) => {
    if (!selectedWO?.dbId) return;
    const nextEntries = selectedWO.costEntries.filter((e) => e.id !== entryId);
    await onUpdateCosts(selectedWO.dbId, nextEntries);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
            <Receipt size={16} className="text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-lg leading-tight">Finance & Cost Management</h2>
            <p className="text-xs font-mono text-muted-foreground">Track equipment, transport, accommodation & other costs per work order</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            className="h-9 px-3 py-1.5 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {[2022, 2023, 2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-9 px-3 py-1.5 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {COST_CATEGORIES.map((cat) => {
          // Map "Spare Part" to "sparePart" property
          const propName = cat === "Spare Part" ? "sparePart" : cat.toLowerCase();
          const val = grandTotals[propName as keyof typeof grandTotals] as number;
          const meta = COST_CATEGORY_META[cat];
          return (
            <Card key={cat} className="p-4">
              <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold mb-2 ${meta.bg} ${meta.text}`}>{cat}</div>
              <p className="text-xl font-bold text-foreground">{fmtCurrency(val)}</p>
              <div className="w-full h-1 rounded-full mt-2 bg-muted">
                <div className="h-1 rounded-full transition-all" style={{ width: `${grandTotals.grand ? Math.min((val / grandTotals.grand) * 100, 100) : 0}%`, background: meta.color }} />
              </div>
            </Card>
          );
        })}
        <Card className="p-4 border-primary/20 bg-primary/5">
          <p className="text-[10px] font-mono text-primary uppercase tracking-widest font-bold mb-2">Total — {MONTHS[parseInt(selectedMonth, 10) - 1]} {selectedYear}</p>
          <p className="text-xl font-bold text-primary">{fmtCurrency(grandTotals.grand)}</p>
          <p className="text-xs text-muted-foreground mt-1">{currentMonthEntriesCount} entries</p>
        </Card>
      </div>

      {/* Monthly chart */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Monthly Cost Breakdown — {selectedYear}</h3>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">Transportation · Accommodation · Labor · Spare Part · Others — stacked by month</p>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyChartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", fill: "#6B7280" }} axisLine={false} tickLine={false} width={44} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }} />
              <Bar key="Transportation" dataKey="Transportation" stackId="a" fill="#F59E0B" />
              <Bar key="Accommodation"  dataKey="Accommodation"  stackId="a" fill="#8B5CF6" />
              <Bar key="Labor"          dataKey="Labor"          stackId="a" fill="#3B82F6" />
              <Bar key="Spare Part"     dataKey="Spare Part"     stackId="a" fill="#EC4899" />
              <Bar key="Others"         dataKey="Others"         stackId="a" fill="#10B981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Two-panel: WO list + cost entries */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Left: Work Order list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono placeholder:font-sans placeholder:text-muted-foreground"
              placeholder="Search work orders…" value={woSearch} onChange={(e) => setWoSearch(e.target.value)} />
          </div>
          <div className="space-y-2">
            {pageItems.map((wo) => {
              const total = woTotal(wo);
              const machine = getMachine(wo.machineId);
              const isSelected = selectedWOId === wo.id;
              return (
                <button key={wo.id} onClick={() => setSelectedWOId(wo.id)}
                  className={`w-full text-left rounded-lg border p-4 transition-all ${isSelected ? "border-primary bg-primary shadow-md" : "border-border bg-card hover:border-primary/40"}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`font-mono text-xs font-bold ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>{wo.id}</span>
                    <Badge className={isSelected ? "bg-white/20 text-white" : woStatusColor(wo.status)}>{woStatusIcon(wo.status)}{wo.status}</Badge>
                  </div>
                  <p className={`text-sm font-semibold truncate ${isSelected ? "text-white" : "text-foreground"}`}>{wo.title}</p>
                  <div className={`flex items-center justify-between mt-2 text-xs ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>
                    <span className="font-mono">{wo.machineId} · {machine?.site ?? "—"}</span>
                    <span className={`font-mono font-bold ${isSelected ? "text-white" : total > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                      {total > 0 ? fmtCurrency(total) : "No costs"}
                    </span>
                  </div>
                  {wo.costEntries.filter(e => e.date.startsWith(`${selectedYear}-${selectedMonth}`)).length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {COST_CATEGORIES.filter((c) => catTotal(wo, c) > 0).map((c) => (
                        <span key={c} className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isSelected ? "bg-white/15 text-white" : `${COST_CATEGORY_META[c].bg} ${COST_CATEGORY_META[c].text}`}`}>{c}</span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
            <Card className="overflow-hidden">
              <TablePaginationBar
                page={pagination.page}
                pageSize={pagination.pageSize}
                totalItems={pagination.totalItems}
                totalPages={pagination.totalPages}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                pageNumbers={pagination.pageNumbers}
                onPageChange={pagination.setPage}
                onPageSizeChange={pagination.setPageSize}
                label="work order(s)"
              />
            </Card>
          </div>
        </div>

        {/* Right: Cost entries detail */}
        <div className="lg:col-span-3">
          {!selectedWO ? (
            <Card className="flex flex-col items-center justify-center h-64 text-center">
              <Receipt size={36} className="text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Select a work order to manage its costs</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* WO header */}
              <Card className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-muted-foreground">{selectedWO.id}</span>
                      <Badge className={woStatusColor(selectedWO.status)}>{woStatusIcon(selectedWO.status)}{selectedWO.status}</Badge>
                    </div>
                    <h3 className="font-semibold text-foreground">{selectedWO.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedWO.machineId} · {getMachine(selectedWO.machineId)?.site} · Assigned to {getUserName(selectedWO.assignedTo)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Total Costs</p>
                    <p className="text-2xl font-bold text-foreground mt-0.5">{fmtCurrency(woTotal(selectedWO))}</p>
                    <p className="text-xs text-muted-foreground">{selectedWO.costEntries.filter(e => e.date.startsWith(`${selectedYear}-${selectedMonth}`)).length} entries this month</p>
                  </div>
                </div>

                {/* Category breakdown mini-cards */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-border">
                  {COST_CATEGORIES.map((cat) => {
                    const val = catTotal(selectedWO, cat);
                    const meta = COST_CATEGORY_META[cat];
                    return (
                      <div key={cat} className="text-center">
                        <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${meta.bg} ${meta.text}`}>{cat}</div>
                        <p className={`text-sm font-bold mt-1 ${val > 0 ? meta.text : "text-muted-foreground"}`}>{fmtCurrency(val)}</p>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Cost entries */}
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                  <h4 className="font-semibold text-sm text-foreground">Cost Entries</h4>
                  {canEdit && (
                    <button onClick={openAdd}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
                      <Plus size={13} />Add Entry
                    </button>
                  )}
                </div>

                {selectedWO.costEntries.filter(e => e.date.startsWith(`${selectedYear}-${selectedMonth}`)).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <DollarSign size={28} className="text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No cost entries for {MONTHS[parseInt(selectedMonth, 10) - 1]} {selectedYear}</p>
                    {canEdit && (
                      <button onClick={openAdd} className="mt-3 text-xs font-mono text-foreground hover:text-foreground transition-colors">
                        + Add cost entry
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="text-left px-4 py-2.5 text-xs font-mono text-muted-foreground uppercase tracking-wider">Category</th>
                          <th className="text-left px-4 py-2.5 text-xs font-mono text-muted-foreground uppercase tracking-wider">Details</th>
                          <th className="text-left px-4 py-2.5 text-xs font-mono text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Date</th>
                          <th className="text-right px-4 py-2.5 text-xs font-mono text-muted-foreground uppercase tracking-wider">Amount</th>
                          {canEdit && <th className="px-4 py-2.5 w-16" />}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {[...selectedWO.costEntries]
                          .filter(e => e.date.startsWith(`${selectedYear}-${selectedMonth}`))
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .map((entry) => {
                          const meta = COST_CATEGORY_META[entry.category];
                          return (
                            <tr key={entry.id} className="hover:bg-muted/30 transition-colors group">
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${meta.bg} ${meta.text}`}>
                                  {entry.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-foreground max-w-[180px]">
                                {entry.details ? (
                                  <p className="truncate text-muted-foreground">{entry.details}</p>
                                ) : (
                                  <span className="text-muted-foreground/40">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap hidden sm:table-cell">{formatDate(entry.date)}</td>
                              <td className="px-4 py-3 text-right font-mono text-sm font-bold" style={{ color: meta.color }}>{fmtCurrency(entry.amount)}</td>
                              {canEdit && (
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(entry)}
                                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                      <Pencil size={13} />
                                    </button>
                                    <button onClick={() => deleteEntry(entry.id)}
                                      className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                                      <X size={13} />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-border bg-muted/30">
                          <td colSpan={3} className="px-4 py-3 text-xs font-mono font-semibold text-foreground uppercase">Total</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-foreground">{fmtCurrency(woTotal(selectedWO))}</td>
                          {canEdit && <td />}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit cost entry modal */}
      {showEntryModal && selectedWO && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-3xl rounded-xl shadow-2xl border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-foreground">{editingEntry ? "Edit Cost Entry" : "Add Cost Entry"}</h2>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">{selectedWO.id} · {selectedWO.machineId}</p>
              </div>
              <button onClick={() => setShowEntryModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {editingEntry ? (
                <>
                  <FormField label="Category">
                    <div className="grid grid-cols-2 gap-2">
                      {COST_CATEGORIES.map((cat) => {
                        const meta = COST_CATEGORY_META[cat];
                        const selected = editForm.category === cat;
                        return (
                          <button key={cat} type="button" onClick={() => setEditForm({ ...editForm, category: cat })}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${selected ? "border-primary bg-primary text-white" : "border-border bg-muted/30 text-foreground hover:border-primary/40"}`}>
                            <span className={`w-2 h-2 rounded-full shrink-0`} style={{ background: selected ? "#fff" : meta.color }} />
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </FormField>
                  {["Transportation", "Spare Part", "Others"].includes(editForm.category) && (
                    <FormField label={
                      editForm.category === "Transportation" ? "Route / Destination" :
                      editForm.category === "Spare Part" ? "Part Name & Number" :
                      "Description"
                    }>
                      <input className={inputCls} 
                        placeholder={
                          editForm.category === "Transportation" ? "e.g. Plant A to Plant B" :
                          editForm.category === "Spare Part" ? "e.g. Servo Motor A06B" :
                          "e.g. Advance payment"
                        }
                        value={editForm.details} onChange={(e) => setEditForm({ ...editForm, details: e.target.value })} />
                    </FormField>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Quantity">
                      <input type="number" min="0" step="0.1" className={inputCls + " font-mono"}
                        placeholder="1" value={editForm.quantity}
                        onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })} />
                    </FormField>
                    <FormField label="Unit Price ($)">
                      <div className="relative">
                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="number" min="0" step="0.01" className={inputCls + " pl-8 font-mono"}
                          placeholder="0.00" value={editForm.unitPrice}
                          onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })} />
                      </div>
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <FormField label="Amount ($)">
                      <div className="relative">
                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="number" min="0" step="0.01" className={inputCls + " pl-8 font-mono bg-muted/30"}
                          readOnly value={(!isNaN(parseFloat(editForm.quantity)) && !isNaN(parseFloat(editForm.unitPrice))) ? (parseFloat(editForm.quantity) * parseFloat(editForm.unitPrice)).toFixed(2) : "0.00"} />
                      </div>
                    </FormField>
                    <FormField label="Date">
                      <input type="date" className={inputCls} value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
                    </FormField>
                  </div>
                  {(!isNaN(parseFloat(editForm.quantity)) && !isNaN(parseFloat(editForm.unitPrice))) && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <span className="text-xs font-mono text-muted-foreground">Entry total</span>
                      <span className="font-mono font-bold text-primary">{fmtCurrency(parseFloat(editForm.quantity) * parseFloat(editForm.unitPrice))}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <FormField label="Date (applied to all entries)">
                    <input type="date" className={inputCls} value={addDate}
                      onChange={(e) => setAddDate(e.target.value)} />
                  </FormField>
                  <div className="space-y-4 pt-2">
                    <div className="bg-muted/30 border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="text-left px-3 py-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wider min-w-[180px] w-[200px]">Type</th>
                            <th className="text-left px-3 py-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Details</th>
                            <th className="text-right px-3 py-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wider w-20">Qty</th>
                            <th className="text-right px-3 py-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wider w-24">Unit Price</th>
                            <th className="text-right px-3 py-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wider w-24">Total</th>
                            <th className="w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {posRows.map((row, i) => (
                            <tr key={row.id}>
                              <td className="px-2 py-2">
                                <select className={"w-full px-2 py-1.5 bg-card border border-border rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20"} value={row.category}
                                  onChange={(e) => setPosRows(posRows.map(r => r.id === row.id ? { ...r, category: e.target.value as CostCategory } : r))}>
                                  {COST_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </td>
                              <td className="px-2 py-2">
                                {["Transportation", "Spare Part", "Others"].includes(row.category) ? (
                                  <input className={inputCls + " text-xs py-1.5 h-8 w-full"} 
                                    placeholder={
                                      row.category === "Transportation" ? "Route..." :
                                      row.category === "Spare Part" ? "Part Name..." :
                                      "Description..."
                                    } 
                                    value={row.details}
                                    onChange={(e) => setPosRows(posRows.map(r => r.id === row.id ? { ...r, details: e.target.value } : r))} />
                                ) : (
                                  <div className="h-8"></div>
                                )}
                              </td>
                              <td className="px-2 py-2">
                                <input type="number" min="0" step="0.1" className={inputCls + " text-xs py-1.5 h-8 font-mono text-right w-full"}
                                  placeholder="1" value={row.quantity}
                                  onChange={(e) => setPosRows(posRows.map(r => r.id === row.id ? { ...r, quantity: e.target.value } : r))} />
                              </td>
                              <td className="px-2 py-2">
                                <input type="number" min="0" step="0.01" className={inputCls + " text-xs py-1.5 h-8 font-mono text-right w-full"}
                                  placeholder="0.00" value={row.unitPrice}
                                  onChange={(e) => setPosRows(posRows.map(r => r.id === row.id ? { ...r, unitPrice: e.target.value } : r))} />
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-semibold text-foreground text-xs">
                                {(!isNaN(parseFloat(row.quantity)) && !isNaN(parseFloat(row.unitPrice))) 
                                  ? fmtCurrency(parseFloat(row.quantity) * parseFloat(row.unitPrice)) 
                                  : "$0.00"}
                              </td>
                              <td className="px-1 py-2 text-center">
                                <button onClick={() => setPosRows(posRows.filter(r => r.id !== row.id))} className="text-muted-foreground hover:text-red-500">
                                  <X size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="p-2 bg-card border-t border-border">
                        <button onClick={() => setPosRows([...posRows, { id: `r-${Date.now()}`, category: "Spare Part", quantity: "1", unitPrice: "", details: "" }])}
                          className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-foreground transition-colors px-2 py-1">
                          <Plus size={14} /> Add Row
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <span className="text-xs font-mono text-muted-foreground">Total of new entries</span>
                    <span className="font-mono font-bold text-primary">
                      {fmtCurrency(posRows.reduce((s, r) => s + ((parseFloat(r.quantity) || 0) * (parseFloat(r.unitPrice) || 0)), 0))}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowEntryModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={saveEntry}
                disabled={editingEntry 
                  ? (!editForm.quantity || !editForm.unitPrice || parseFloat(editForm.quantity) <= 0 || parseFloat(editForm.unitPrice) < 0)
                  : posRows.every(r => !parseFloat(r.quantity) || parseFloat(r.quantity) <= 0 || isNaN(parseFloat(r.unitPrice)))}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {editingEntry ? "Save Changes" : "Add Entries"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
