import { useState, useMemo } from "react";
import {
  Search, Bell, ClipboardList, Cpu, LayoutDashboard, ChevronRight,
  CheckCircle2, Clock, AlertTriangle, XCircle, Wrench, Plus, X, User,
  Calendar, MapPin, ShieldCheck, ShieldAlert, ChevronDown, FileText,
  Camera, DollarSign, BarChart2, ChevronLeft, Package, TrendingUp,
  Truck, Navigation, Phone, Flag, Receipt, Pencil, ArrowRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type MachineStatus = "Operational" | "Under Maintenance" | "Broken" | "Offline";
type WorkOrderStatus =
  | "Assigned"
  | "Technician En Route"
  | "Technician Arrived"
  | "Work In Progress"
  | "Work Completed"
  | "Verified & Closed"
  | "Cancelled";
type UserRole = "Manager" | "Technician" | "Owner" | "Worker" | "Finance";
type IssueCategory = "Mechanical" | "Electrical" | "Software / Firmware" | "Hydraulic" | "Preventive Maintenance";
type FaultSeverity = "Low" | "Medium" | "High" | "Critical";
type CostCategory = "Transportation" | "Accommodation" | "Labor" | "Spare Part" | "Others";

interface CostEntry {
  id: string;
  category: CostCategory;
  amount: number;
  quantity?: number;
  unitPrice?: number;
  date: string;
  details?: string;
}

const WO_FLOW: WorkOrderStatus[] = [
  "Assigned",
  "Technician En Route",
  "Technician Arrived",
  "Work In Progress",
  "Work Completed",
  "Verified & Closed",
];

const SITES = ["Plant A", "Plant B", "Plant C", "Plant D", "Head Office"];

interface HistoryEntry { id: string; date: string; action: string; by: string; }

interface Machine {
  id: string; name: string; model: string; site: string;
  factoryGroup: string; factory: string;
  installDate: string; installedBy: string; status: MachineStatus;
  history: HistoryEntry[];
}

interface WorkOrder {
  id: string; machineId: string; title: string; description: string;
  assignedTo: string; createdBy: string; status: WorkOrderStatus;
  createdAt: string; updatedAt: string; priority: "Low" | "Medium" | "High";
  notes: string; faultReportId?: string;
  costEntries: CostEntry[];
}

interface Notification {
  id: string; userId: string; message: string; read: boolean;
  workOrderId: string; createdAt: string;
}

interface AppUser { id: string; name: string; role: UserRole; site: string; phone?: string; }

interface RepairPhoto { id: string; url: string; type: "before" | "after"; caption: string; }
interface PartReplaced { name: string; partNumber: string; cost: number; }

interface RepairRecord {
  id: string; workOrderId: string; machineId: string; date: string;
  issueCategory: IssueCategory; issueDescription: string;
  partsReplaced: PartReplaced[]; laborCost: number; totalCost: number;
  technicianId: string; photos: RepairPhoto[];
}

interface FaultReport {
  id: string; machineId: string; reportedBy: string;
  description: string; severity: FaultSeverity; category: IssueCategory;
  status: "Open" | "Converted" | "Dismissed";
  createdAt: string; convertedToWO?: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const USERS: AppUser[] = [
  { id: "u1", name: "Marcus Webb",   role: "Manager",    site: "All Sites", phone: "+1-555-0101" },
  { id: "u2", name: "Priya Nair",    role: "Technician", site: "Plant A",   phone: "+1-555-0142" },
  { id: "u3", name: "Derek Santos",  role: "Technician", site: "Plant B",   phone: "+1-555-0163" },
  { id: "u4", name: "Aisha Okafor",  role: "Technician", site: "Plant C",   phone: "+1-555-0178" },
  { id: "u5", name: "Lena Fischer",  role: "Owner",      site: "All Sites", phone: "+1-555-0195" },
  { id: "u6", name: "James Osei",    role: "Worker",     site: "Plant B",   phone: "+1-555-0187" },
  { id: "u7", name: "Diana Park",    role: "Finance",    site: "All Sites", phone: "+1-555-0209" },
];

const MACHINES_SEED: Machine[] = [
  {
    id: "MCH-0042", name: "Welding Arm Alpha", model: "FANUC ARC Mate 120iD",
    site: "Plant A", factoryGroup: "North America Manufacturing", factory: "Detroit Assembly",
    installDate: "2023-04-15", installedBy: "Marcus Webb", status: "Operational",
    history: [
      { id: "h1", date: "2023-04-15", action: "Machine installed and commissioned", by: "Marcus Webb" },
      { id: "h2", date: "2023-09-10", action: "Routine calibration performed", by: "Priya Nair" },
      { id: "h3", date: "2024-02-20", action: "Servo motor replaced — WO-0002", by: "Priya Nair" },
    ],
  },
  {
    id: "MCH-0071", name: "Assembly Bot Bravo", model: "KUKA KR 6 R700",
    site: "Plant A", factoryGroup: "North America Manufacturing", factory: "Detroit Assembly",
    installDate: "2022-11-03", installedBy: "Marcus Webb", status: "Under Maintenance",
    history: [
      { id: "h4", date: "2022-11-03", action: "Machine installed and commissioned", by: "Marcus Webb" },
      { id: "h5", date: "2023-05-18", action: "Coolant system flushed and refilled", by: "Priya Nair" },
      { id: "h6", date: "2024-06-01", action: "Fault reported — coolant leak (FR-002). WO-0021 created.", by: "Marcus Webb" },
    ],
  },
  {
    id: "MCH-0103", name: "Palletizer Charlie", model: "ABB IRB 660",
    site: "Plant B", factoryGroup: "Europe Logistics", factory: "Berlin Hub",
    installDate: "2024-01-20", installedBy: "Derek Santos", status: "Broken",
    history: [
      { id: "h7", date: "2024-01-20", action: "Machine installed and commissioned", by: "Derek Santos" },
      { id: "h8", date: "2024-07-04", action: "Fault reported — joint 2 grinding (FR-001). WO-0025 created.", by: "Derek Santos" },
    ],
  },
  {
    id: "MCH-0118", name: "Paint Sprayer Delta", model: "Yaskawa Motoman PX2750",
    site: "Plant C", factoryGroup: "Asia Pacific Production", factory: "Tokyo Plant",
    installDate: "2023-08-09", installedBy: "Aisha Okafor", status: "Operational",
    history: [
      { id: "h9",  date: "2023-08-09", action: "Machine installed and commissioned", by: "Aisha Okafor" },
      { id: "h10", date: "2024-03-14", action: "Nozzle pack replaced and recalibrated", by: "Aisha Okafor" },
    ],
  },
  {
    id: "MCH-0134", name: "Vision Inspect Echo", model: "Cognex IS-7802M",
    site: "Plant B", factoryGroup: "Europe Logistics", factory: "Berlin Hub",
    installDate: "2023-12-01", installedBy: "Marcus Webb", status: "Offline",
    history: [
      { id: "h11", date: "2023-12-01", action: "Machine installed and commissioned", by: "Marcus Webb" },
      { id: "h12", date: "2024-05-20", action: "Taken offline for firmware upgrade", by: "Derek Santos" },
    ],
  },
];

const WORK_ORDERS_SEED: WorkOrder[] = [
  {
    id: "WO-0021", machineId: "MCH-0071", title: "Coolant leak investigation",
    description: "Machine reporting intermittent coolant pressure drops. Inspect fittings, hoses, and pump assembly. Replace seals as needed.",
    assignedTo: "u2", createdBy: "u1", status: "Work In Progress",
    createdAt: "2024-06-01", updatedAt: "2024-06-03", priority: "High",
    notes: "Checked hose fittings — main seal on pump inlet cracked. Ordered replacement part.",
    faultReportId: "FR-002",
    costEntries: [
      { id: "ce-001", category: "Transportation", amount: 85, quantity: 1, unitPrice: 85, details: "Plant A roundtrip", date: "2024-06-01" },
      { id: "ce-002", category: "Others", amount: 200, quantity: 1, unitPrice: 200, details: "Technician advance", date: "2024-06-01" },
      { id: "ce-003", category: "Accommodation", amount: 95, quantity: 1, unitPrice: 95, details: "Hotel - 1 night", date: "2024-06-02" },
    ],
  },
  {
    id: "WO-0025", machineId: "MCH-0103", title: "Arm fault — joint 3 encoder failure",
    description: "Arm fault alarm F-4320 triggered. Diagnostics indicate encoder failure on joint 3. Full encoder swap required.",
    assignedTo: "u3", createdBy: "u1", status: "Technician En Route",
    createdAt: "2024-07-04", updatedAt: "2024-07-05", priority: "High", notes: "",
    faultReportId: "FR-001",
    costEntries: [
      { id: "ce-004", category: "Transportation", amount: 120, quantity: 1, unitPrice: 120, details: "Fuel & toll - Plant B", date: "2024-07-04" },
      { id: "ce-005", category: "Others", amount: 300, quantity: 1, unitPrice: 300, details: "Advance payment", date: "2024-07-04" },
      { id: "ce-006", category: "Spare Part", amount: 450, quantity: 1, unitPrice: 450, details: "Import duty — joint 3 encoder unit", date: "2024-07-05" },
      { id: "ce-007", category: "Spare Part", amount: 180, quantity: 1, unitPrice: 180, details: "Specialist diagnostic tool rental", date: "2024-07-05" },
    ],
  },
  {
    id: "WO-0027", machineId: "MCH-0042", title: "Scheduled preventive maintenance",
    description: "Quarterly PM per OEM schedule. Grease all joints, check cable harness, update firmware to v4.2.1.",
    assignedTo: "u2", createdBy: "u1", status: "Work Completed",
    createdAt: "2024-06-15", updatedAt: "2024-06-18", priority: "Low",
    notes: "All joints greased. Firmware updated. Cable harness in good condition.",
    costEntries: [
      { id: "ce-008", category: "Transportation", amount: 45, quantity: 1, unitPrice: 45, details: "Mileage - Plant A", date: "2024-06-15" },
    ],
  },
  {
    id: "WO-0029", machineId: "MCH-0134", title: "Firmware upgrade to v3.8.0",
    description: "Apply latest firmware update from Cognex. Requires offline mode. Estimated downtime: 4 hours.",
    assignedTo: "u3", createdBy: "u1", status: "Verified & Closed",
    createdAt: "2024-05-18", updatedAt: "2024-05-20", priority: "Medium",
    notes: "Firmware upgraded successfully. Machine back online.",
    costEntries: [],
  },
];

const FAULT_REPORTS_SEED: FaultReport[] = [
  {
    id: "FR-001", machineId: "MCH-0103", reportedBy: "u6",
    description: "Unusual grinding noise from joint 2 during palletizing cycle. Machine completed the cycle but the noise is intermittent and getting progressively worse. Concerned about catastrophic joint failure.",
    severity: "High", category: "Mechanical",
    status: "Converted", createdAt: "2024-07-04", convertedToWO: "WO-0025",
  },
  {
    id: "FR-002", machineId: "MCH-0071", reportedBy: "u5",
    description: "Coolant fluid dripping from the base of the assembly area. A small puddle has formed on the floor beneath the machine. Unsure if it is leaking from a hose or the pump seal.",
    severity: "High", category: "Hydraulic",
    status: "Converted", createdAt: "2024-06-01", convertedToWO: "WO-0021",
  },
  {
    id: "FR-003", machineId: "MCH-0042", reportedBy: "u6",
    description: "Emergency stop button on control panel 2 is sticking when pressed. It does release but requires extra force. This is a safety concern and needs immediate attention.",
    severity: "Medium", category: "Electrical",
    status: "Open", createdAt: "2024-07-05",
  },
];

const NOTIFICATIONS_SEED: Notification[] = [
  { id: "n1", userId: "u2", message: "You have been assigned Work Order WO-0021: Coolant leak investigation on MCH-0071.", read: true, workOrderId: "WO-0021", createdAt: "2024-06-01" },
  { id: "n2", userId: "u3", message: "You have been assigned Work Order WO-0025: Arm fault — joint 3 encoder failure on MCH-0103.", read: false, workOrderId: "WO-0025", createdAt: "2024-07-04" },
  { id: "n3", userId: "u5", message: "Work Order WO-0027 has been marked complete. Please verify and approve.", read: false, workOrderId: "WO-0027", createdAt: "2024-06-18" },
];

const REPAIR_RECORDS_SEED: RepairRecord[] = [
  {
    id: "RR-001", workOrderId: "WO-0002", machineId: "MCH-0042", date: "2024-02-20", issueCategory: "Mechanical",
    issueDescription: "Servo motor on axis J2 failed mid-cycle. Fault code SM-2201. Motor showed signs of overheating and bearing wear. Production halted for 6 hours.",
    partsReplaced: [
      { name: "FANUC Servo Motor A06B-0227", partNumber: "A06B-0227-B100", cost: 1850 },
      { name: "Bearing Kit J2", partNumber: "BK-FANUC-J2", cost: 120 },
    ],
    laborCost: 480, totalCost: 2450, technicianId: "u2",
    photos: [
      { id: "p1", url: "https://images.unsplash.com/photo-1638519935147-543ed5c02542?w=600&h=400&fit=crop&auto=format", type: "before", caption: "Corrosion and wear visible on servo motor housing" },
      { id: "p2", url: "https://images.unsplash.com/photo-1694537583824-bf22a6b54cbe?w=600&h=400&fit=crop&auto=format", type: "before", caption: "Burnt wiring harness near motor connector" },
      { id: "p3", url: "https://images.unsplash.com/photo-1528953030358-b0c7de371f1f?w=600&h=400&fit=crop&auto=format", type: "after", caption: "New servo motor installed and torqued to spec" },
      { id: "p4", url: "https://images.unsplash.com/photo-1504941319307-771ebfa02a51?w=600&h=400&fit=crop&auto=format", type: "after", caption: "System test running — all axis movements nominal" },
    ],
  },
  {
    id: "RR-002", workOrderId: "WO-0005", machineId: "MCH-0071", date: "2024-01-15", issueCategory: "Hydraulic",
    issueDescription: "Hydraulic pressure loss in clamping circuit. Pressure dropped below 80 bar. Main cylinder seal pack degraded.",
    partsReplaced: [
      { name: "Parker Seal Kit 2\" Cylinder", partNumber: "PK-2CYL-078", cost: 340 },
      { name: "Hydraulic Hose Assembly 1m", partNumber: "HH-1000-12", cost: 95 },
    ],
    laborCost: 320, totalCost: 755, technicianId: "u2",
    photos: [
      { id: "p5", url: "https://images.unsplash.com/photo-1666537072259-e210b6b92608?w=600&h=400&fit=crop&auto=format", type: "before", caption: "Hydraulic leak visible at main cylinder base" },
      { id: "p6", url: "https://images.unsplash.com/photo-1598299803204-b73796f43289?w=600&h=400&fit=crop&auto=format", type: "after", caption: "Technician confirming seal replacement complete" },
    ],
  },
  {
    id: "RR-003", workOrderId: "WO-0008", machineId: "MCH-0118", date: "2024-03-14", issueCategory: "Mechanical",
    issueDescription: "Nozzle pack clogged and spray pattern uneven. Two nozzles fully blocked. Recalibration required after replacement.",
    partsReplaced: [
      { name: "Spray Nozzle Pack (set of 8)", partNumber: "SNP-PX2750-08", cost: 520 },
      { name: "Nozzle Filter Assembly", partNumber: "NFA-200", cost: 65 },
    ],
    laborCost: 240, totalCost: 825, technicianId: "u4",
    photos: [
      { id: "p7", url: "https://images.unsplash.com/photo-1637002722490-5f8ceed9774c?w=600&h=400&fit=crop&auto=format", type: "before", caption: "Blocked nozzle array — visible paint buildup" },
      { id: "p8", url: "https://images.unsplash.com/photo-1730584474338-aa8d9d186bf7?w=600&h=400&fit=crop&auto=format", type: "after", caption: "New nozzle pack installed — spray pattern verified" },
    ],
  },
  {
    id: "RR-004", workOrderId: "WO-0011", machineId: "MCH-0042", date: "2024-04-03", issueCategory: "Electrical",
    issueDescription: "Intermittent E-stop circuit fault. Control panel showed fault code E-1044. Traced to worn contact in safety relay module.",
    partsReplaced: [
      { name: "Pilz PNOZ X3 Safety Relay", partNumber: "PNOZ-X3-24VDC", cost: 290 },
      { name: "Cable Loom 3m", partNumber: "CL-CTRL-3M", cost: 45 },
    ],
    laborCost: 180, totalCost: 515, technicianId: "u2",
    photos: [
      { id: "p9",  url: "https://images.unsplash.com/photo-1694537583824-bf22a6b54cbe?w=600&h=400&fit=crop&auto=format", type: "before", caption: "Control cabinet — worn contact visible on safety relay" },
      { id: "p10", url: "https://images.unsplash.com/photo-1565954786194-d22abeaac3ae?w=600&h=400&fit=crop&auto=format", type: "after", caption: "New safety relay wired and tested" },
    ],
  },
  {
    id: "RR-005", workOrderId: "WO-0015", machineId: "MCH-0071", date: "2024-04-22", issueCategory: "Mechanical",
    issueDescription: "Gripper end-effector lost grip force. Pneumatic actuator diaphragm ruptured. Full actuator assembly replaced.",
    partsReplaced: [
      { name: "Pneumatic Actuator Assy KUKA", partNumber: "KR6-GRIP-ACT", cost: 670 },
      { name: "Air Fitting Set", partNumber: "AFS-6MM-10PK", cost: 38 },
    ],
    laborCost: 280, totalCost: 988, technicianId: "u2",
    photos: [
      { id: "p11", url: "https://images.unsplash.com/photo-1638519935147-543ed5c02542?w=600&h=400&fit=crop&auto=format", type: "before", caption: "Ruptured diaphragm — visible crack along seam" },
      { id: "p12", url: "https://images.unsplash.com/photo-1504941319307-771ebfa02a51?w=600&h=400&fit=crop&auto=format", type: "after", caption: "New actuator fitted — grip test at 850N confirmed" },
    ],
  },
  {
    id: "RR-006", workOrderId: "WO-0018", machineId: "MCH-0134", date: "2024-05-20", issueCategory: "Software / Firmware",
    issueDescription: "Vision system firmware v3.7.2 causing false reject rate spike (12% vs expected <2%). Upgraded to v3.8.0.",
    partsReplaced: [],
    laborCost: 360, totalCost: 360, technicianId: "u3",
    photos: [
      { id: "p13", url: "https://images.unsplash.com/photo-1637002722490-5f8ceed9774c?w=600&h=400&fit=crop&auto=format", type: "before", caption: "HMI showing elevated false reject alarm log" },
      { id: "p14", url: "https://images.unsplash.com/photo-1730584474338-aa8d9d186bf7?w=600&h=400&fit=crop&auto=format", type: "after", caption: "Post-upgrade dashboard — reject rate 1.4%" },
    ],
  },
  {
    id: "RR-007", workOrderId: "WO-0027", machineId: "MCH-0042", date: "2024-06-18", issueCategory: "Preventive Maintenance",
    issueDescription: "Quarterly PM completed per OEM schedule. All 6 joints greased, cable harness inspected, firmware updated to v4.2.1.",
    partsReplaced: [{ name: "FANUC Grease Kit (6-axis)", partNumber: "GK-FANUC-6A", cost: 145 }],
    laborCost: 240, totalCost: 385, technicianId: "u2",
    photos: [
      { id: "p15", url: "https://images.unsplash.com/photo-1598299803204-b73796f43289?w=600&h=400&fit=crop&auto=format", type: "before", caption: "Pre-PM inspection — joint grease visually degraded" },
      { id: "p16", url: "https://images.unsplash.com/photo-1528953030358-b0c7de371f1f?w=600&h=400&fit=crop&auto=format", type: "after", caption: "All joints regreased — cable harness secured" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function warrantyStatus(installDate: string) {
  const install = new Date(installDate);
  const expires = new Date(install);
  expires.setFullYear(expires.getFullYear() + 1);
  const now = new Date();
  const active = now < expires;
  return { active, label: active ? "Active" : "Expired", expires: expires.toISOString().split("T")[0] };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function fmtCurrency(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function statusColor(status: MachineStatus) {
  switch (status) {
    case "Operational":       return "bg-green-100 text-green-800";
    case "Under Maintenance": return "bg-yellow-100 text-yellow-800";
    case "Broken":            return "bg-red-100 text-red-800";
    case "Offline":           return "bg-gray-200 text-gray-600";
  }
}

function woStatusColor(status: WorkOrderStatus) {
  switch (status) {
    case "Assigned":             return "bg-blue-100 text-blue-800";
    case "Technician En Route":  return "bg-purple-100 text-purple-800";
    case "Technician Arrived":   return "bg-cyan-100 text-cyan-800";
    case "Work In Progress":     return "bg-yellow-100 text-yellow-800";
    case "Work Completed":       return "bg-orange-100 text-orange-800";
    case "Verified & Closed":    return "bg-green-100 text-green-800";
    case "Cancelled":            return "bg-red-100 text-red-700";
  }
}

function woStatusIcon(status: WorkOrderStatus) {
  switch (status) {
    case "Assigned":             return <Clock size={14} />;
    case "Technician En Route":  return <Truck size={14} />;
    case "Technician Arrived":   return <Navigation size={14} />;
    case "Work In Progress":     return <Wrench size={14} />;
    case "Work Completed":       return <CheckCircle2 size={14} />;
    case "Verified & Closed":    return <ShieldCheck size={14} />;
    case "Cancelled":            return <XCircle size={14} />;
  }
}

function machineStatusIcon(status: MachineStatus) {
  switch (status) {
    case "Operational":       return <CheckCircle2 size={14} className="text-green-600" />;
    case "Under Maintenance": return <Wrench size={14} className="text-yellow-600" />;
    case "Broken":            return <XCircle size={14} className="text-red-600" />;
    case "Offline":           return <AlertTriangle size={14} className="text-gray-500" />;
  }
}

function priorityColor(p: "Low" | "Medium" | "High") {
  switch (p) {
    case "Low":    return "bg-gray-100 text-gray-600";
    case "Medium": return "bg-blue-100 text-blue-700";
    case "High":   return "bg-red-100 text-red-700";
  }
}

function severityColor(s: FaultSeverity) {
  switch (s) {
    case "Low":      return "bg-gray-100 text-gray-700";
    case "Medium":   return "bg-yellow-100 text-yellow-800";
    case "High":     return "bg-orange-100 text-orange-800";
    case "Critical": return "bg-red-100 text-red-800";
  }
}

const CATEGORY_COLORS: Record<IssueCategory, string> = {
  "Mechanical": "#1A2942",
  "Electrical": "#F59E0B",
  "Software / Firmware": "#3B82F6",
  "Hydraulic": "#10B981",
  "Preventive Maintenance": "#6B7280",
};

const ISSUE_CATEGORIES: IssueCategory[] = [
  "Mechanical", "Electrical", "Software / Firmware", "Hydraulic", "Preventive Maintenance",
];

// ─── Shared Components ────────────────────────────────────────────────────────

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium ${className}`}>
      {children}
    </span>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-lg border border-border shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30";
const selectCls = inputCls + " font-mono";

// ─── Dashboard View ───────────────────────────────────────────────────────────

function DashboardView({
  machines, workOrders, repairRecords, faultReports, onNavigate,
}: {
  machines: Machine[]; workOrders: WorkOrder[];
  repairRecords: RepairRecord[]; faultReports: FaultReport[];
  onNavigate: (view: string, id?: string) => void;
}) {
  const stats = {
    total: machines.length,
    operational: machines.filter((m) => m.status === "Operational").length,
  };
  const totalRepairCost = repairRecords.reduce((s, r) => s + r.totalCost, 0);
  const openFaults = faultReports.filter((f) => f.status === "Open");
  const openOrders = workOrders.filter((w) => w.status !== "Verified & Closed" && w.status !== "Cancelled");
  const recentOrders = [...workOrders].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Total Machines</p>
          <p className="text-3xl font-bold text-primary mt-1">{stats.total}</p>
          <p className="text-xs text-muted-foreground mt-1">Across all sites</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Operational</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{stats.operational}</p>
          <div className="w-full h-1 bg-gray-100 rounded-full mt-2">
            <div className="h-1 bg-green-500 rounded-full" style={{ width: `${(stats.operational / stats.total) * 100}%` }} />
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Open Faults</p>
          <p className={`text-3xl font-bold mt-1 ${openFaults.length > 0 ? "text-red-600" : "text-green-600"}`}>{openFaults.length}</p>
          <button onClick={() => onNavigate("faults")} className="text-xs font-mono text-accent hover:text-amber-600 transition-colors mt-1">
            View fault reports →
          </button>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Total Repair Cost YTD</p>
          <p className="text-3xl font-bold text-accent mt-1">{fmtCurrency(totalRepairCost)}</p>
          <button onClick={() => onNavigate("analytics")} className="text-xs font-mono text-accent hover:text-amber-600 transition-colors mt-1">
            View analytics →
          </button>
        </Card>
      </div>

      {openFaults.length > 0 && (
        <Card className="border-l-4 border-l-red-500 overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-2">
            <Flag size={16} className="text-red-500" />
            <h2 className="font-semibold text-foreground">Open Fault Reports</h2>
            <span className="ml-auto text-xs font-mono text-muted-foreground">Awaiting manager action</span>
          </div>
          <div className="divide-y divide-border">
            {openFaults.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 cursor-pointer" onClick={() => onNavigate("faults", f.id)}>
                <Badge className={severityColor(f.severity)}>{f.severity}</Badge>
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-xs text-muted-foreground mr-2">{f.machineId}</span>
                  <span className="text-sm text-foreground">{f.description.slice(0, 70)}…</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{formatDate(f.createdAt)}</span>
                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Recent Work Orders</h2>
            <button onClick={() => onNavigate("workorders")} className="text-xs font-mono text-accent hover:text-amber-600 transition-colors">View all →</button>
          </div>
          <div className="divide-y divide-border">
            {recentOrders.map((wo) => (
              <div key={wo.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => onNavigate("workorders", wo.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{wo.id}</span>
                    <Badge className={woStatusColor(wo.status)}>{woStatusIcon(wo.status)}{wo.status}</Badge>
                    <Badge className={priorityColor(wo.priority)}>{wo.priority}</Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground mt-0.5 truncate">{wo.title}</p>
                  <p className="text-xs text-muted-foreground">{wo.machineId}</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-border"><h2 className="font-semibold text-foreground">Fleet at a Glance</h2></div>
          <div className="divide-y divide-border">
            {machines.map((m) => {
              const w = warrantyStatus(m.installDate);
              const openFaultCount = faultReports.filter((f) => f.machineId === m.id && f.status === "Open").length;
              return (
                <div key={m.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => onNavigate("machines", m.id)}>
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0"><Cpu size={16} className="text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono font-semibold text-primary">{m.id}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.site}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={statusColor(m.status)}>{machineStatusIcon(m.status)}{m.status}</Badge>
                    {openFaultCount > 0 && <Badge className="bg-red-100 text-red-700"><Flag size={10} />{openFaultCount}</Badge>}
                    {!w.active && <Badge className="bg-red-50 text-red-600">Warranty Expired</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {openOrders.filter((w) => w.status === "Work Completed").length > 0 && (
        <Card className="border-l-4 border-l-accent overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-accent" />
            <h2 className="font-semibold text-foreground">Pending Verification</h2>
            <span className="ml-auto text-xs font-mono text-muted-foreground">Action required by Owner</span>
          </div>
          <div className="divide-y divide-border">
            {openOrders.filter((w) => w.status === "Work Completed").map((wo) => (
              <div key={wo.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 cursor-pointer" onClick={() => onNavigate("workorders", wo.id)}>
                <span className="font-mono text-sm font-semibold text-foreground">{wo.id}</span>
                <span className="text-sm text-foreground">{wo.title}</span>
                <span className="text-xs text-muted-foreground ml-auto">{wo.machineId}</span>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Machine Registry View ────────────────────────────────────────────────────

function MachineRegistryView({
  machines, setMachines, workOrders, repairRecords, faultReports, setFaultReports,
  focusId, onNavigate, currentUser,
}: {
  machines: Machine[]; setMachines: (m: Machine[]) => void;
  workOrders: WorkOrder[]; repairRecords: RepairRecord[];
  faultReports: FaultReport[]; setFaultReports: (f: FaultReport[]) => void;
  focusId?: string; onNavigate: (view: string, id?: string) => void;
  currentUser: AppUser;
}) {
  const [search, setSearch] = useState(focusId ? "" : "");
  const [selected, setSelected] = useState<Machine | null>(
    focusId ? machines.find((m) => m.id === focusId) ?? null : null
  );
  const [showAddMachine, setShowAddMachine] = useState(false);
  const [showReportFault, setShowReportFault] = useState(false);
  const [newM, setNewM] = useState({ id: "", name: "", model: "", site: "Plant A", factoryGroup: "North America Manufacturing", factory: "Detroit Assembly", installDate: "", installedBy: currentUser.name });
  const [newFault, setNewFault] = useState({ description: "", severity: "Medium" as FaultSeverity, category: "Mechanical" as IssueCategory });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return machines.filter((m) =>
      m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) ||
      m.site.toLowerCase().includes(q) || m.model.toLowerCase().includes(q)
    );
  }, [search, machines]);

  const machineOrders = selected ? workOrders.filter((w) => w.machineId === selected.id) : [];
  const machineRepairs = selected ? repairRecords.filter((r) => r.machineId === selected.id) : [];
  const machineFaults = selected ? faultReports.filter((f) => f.machineId === selected.id) : [];
  const canReportFault = ["Worker", "Owner", "Manager", "Technician"].includes(currentUser.role);

  const addMachine = () => {
    if (!newM.id || !newM.name || !newM.installDate) return;
    const machine: Machine = {
      id: newM.id.toUpperCase(), name: newM.name, model: newM.model || "—",
      site: newM.site, factoryGroup: newM.factoryGroup, factory: newM.factory,
      installDate: newM.installDate, installedBy: newM.installedBy,
      status: "Operational",
      history: [{ id: `h-${Date.now()}`, date: newM.installDate, action: "Machine installed and commissioned", by: newM.installedBy }],
    };
    setMachines([...machines, machine]);
    setNewM({ id: "", name: "", model: "", site: "Plant A", factoryGroup: "North America Manufacturing", factory: "Detroit Assembly", installDate: "", installedBy: currentUser.name });
    setShowAddMachine(false);
    setSelected(machine);
  };

  const reportFault = () => {
    if (!selected || !newFault.description) return;
    const fault: FaultReport = {
      id: `FR-${String(faultReports.length + 1).padStart(3, "0")}`,
      machineId: selected.id, reportedBy: currentUser.id,
      description: newFault.description, severity: newFault.severity,
      category: newFault.category, status: "Open", createdAt: new Date().toISOString().split("T")[0],
    };
    setFaultReports([...faultReports, fault]);
    setNewFault({ description: "", severity: "Medium", category: "Mechanical" });
    setShowReportFault(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* List panel */}
      <div className="lg:col-span-2 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono placeholder:font-sans placeholder:text-muted-foreground"
              placeholder="Search ID, name, site…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {(currentUser.role === "Manager" || currentUser.role === "Owner") && (
            <button onClick={() => setShowAddMachine(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors shrink-0">
              <Plus size={14} />Add
            </button>
          )}
        </div>
        <div className="space-y-2">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No machines found</p>}
          {filtered.map((m) => {
            const w = warrantyStatus(m.installDate);
            const isSelected = selected?.id === m.id;
            const repairCount = repairRecords.filter((r) => r.machineId === m.id).length;
            const openFaultCount = faultReports.filter((f) => f.machineId === m.id && f.status === "Open").length;
            return (
              <button key={m.id} onClick={() => setSelected(m)}
                className={`w-full text-left rounded-lg border p-4 transition-all ${isSelected ? "border-primary bg-primary shadow-md" : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"}`}>
                <div className="flex items-center justify-between">
                  <span className={`font-mono font-bold text-sm ${isSelected ? "text-white" : "text-primary"}`}>{m.id}</span>
                  <div className="flex items-center gap-1.5">
                    {openFaultCount > 0 && <Badge className="bg-red-100 text-red-700"><Flag size={10} />{openFaultCount}</Badge>}
                    <Badge className={isSelected ? "bg-white/20 text-white" : statusColor(m.status)}>{machineStatusIcon(m.status)}{m.status}</Badge>
                  </div>
                </div>
                <p className={`text-sm font-medium mt-1 ${isSelected ? "text-white/90" : "text-foreground"}`}>{m.name}</p>
                <div className={`flex items-center gap-3 mt-1 text-xs ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>
                  <span className="flex items-center gap-1"><MapPin size={11} />{m.site}</span>
                  <span className="flex items-center gap-1">{w.active ? <ShieldCheck size={11} /> : <ShieldAlert size={11} />}Warranty {w.label}</span>
                  {repairCount > 0 && <span className="flex items-center gap-1"><Wrench size={11} />{repairCount}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div className="lg:col-span-3">
        {!selected ? (
          <Card className="flex flex-col items-center justify-center h-64 text-center">
            <Cpu size={40} className="text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Select a machine to view its full profile</p>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-2xl font-bold text-primary">{selected.id}</span>
                    <Badge className={statusColor(selected.status)}>{machineStatusIcon(selected.status)}{selected.status}</Badge>
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">{selected.name}</h2>
                  <p className="text-sm text-muted-foreground">{selected.model}</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {canReportFault && (
                    <button onClick={() => setShowReportFault(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors">
                      <Flag size={13} />Report Fault
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-border">
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Location</p>
                  <p className="text-sm font-medium text-foreground mt-0.5 flex flex-col gap-0.5">
                    <span className="flex items-center gap-1"><MapPin size={13} className="text-muted-foreground" />{selected.site}</span>
                    <span className="text-xs text-muted-foreground pl-4">{selected.factoryGroup} &rarr; {selected.factory}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Install Date</p>
                  <p className="text-sm font-medium text-foreground mt-0.5 flex items-center gap-1"><Calendar size={13} className="text-muted-foreground" />{formatDate(selected.installDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Installed By</p>
                  <p className="text-sm font-medium text-foreground mt-0.5 flex items-center gap-1"><User size={13} className="text-muted-foreground" />{selected.installedBy}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Warranty</p>
                  {(() => {
                    const w = warrantyStatus(selected.installDate);
                    return (
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        <span className={`inline-flex items-center gap-1 text-sm font-medium ${w.active ? "text-green-600" : "text-red-600"}`}>
                          {w.active ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}{w.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{w.active ? "Expires" : "Expired"} {formatDate(w.expires)}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </Card>

            {machineFaults.filter((f) => f.status === "Open").length > 0 && (
              <Card className="overflow-hidden border-red-200">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-red-50">
                  <div className="flex items-center gap-2"><Flag size={14} className="text-red-500" /><h3 className="font-semibold text-sm text-red-800">Open Fault Reports</h3></div>
                  <button onClick={() => onNavigate("faults")} className="text-xs font-mono text-red-600 hover:text-red-800 transition-colors">View all →</button>
                </div>
                <div className="divide-y divide-border">
                  {machineFaults.filter((f) => f.status === "Open").map((f) => (
                    <div key={f.id} className="px-5 py-3 flex items-start gap-3 cursor-pointer hover:bg-muted/30" onClick={() => onNavigate("faults", f.id)}>
                      <Badge className={severityColor(f.severity)}>{f.severity}</Badge>
                      <p className="text-sm text-foreground flex-1 line-clamp-2">{f.description}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{formatDate(f.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {machineRepairs.length > 0 && (
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                  <h3 className="font-semibold text-sm text-foreground">Repair Summary</h3>
                  <button onClick={() => onNavigate("repairs", selected.id)} className="text-xs font-mono text-accent hover:text-amber-600 transition-colors">Full records →</button>
                </div>
                <div className="px-5 py-4 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Repairs</p>
                    <p className="text-2xl font-bold text-primary mt-0.5">{machineRepairs.length}</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Total Cost</p>
                    <p className="text-2xl font-bold text-accent mt-0.5">{fmtCurrency(machineRepairs.reduce((s, r) => s + r.totalCost, 0))}</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Last Repair</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{formatDate([...machineRepairs].sort((a, b) => b.date.localeCompare(a.date))[0].date)}</p>
                  </div>
                </div>
              </Card>
            )}

            {machineOrders.length > 0 && (
              <Card className="overflow-hidden">
                <div className="px-5 py-3 border-b border-border"><h3 className="font-semibold text-sm text-foreground">Work Orders</h3></div>
                <div className="divide-y divide-border">
                  {machineOrders.map((wo) => (
                    <div key={wo.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-xs text-muted-foreground">{wo.id}</span>
                          <Badge className={woStatusColor(wo.status)}>{woStatusIcon(wo.status)}{wo.status}</Badge>
                        </div>
                        <p className="text-sm text-foreground truncate">{wo.title}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{formatDate(wo.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="overflow-hidden">
              <div className="px-5 py-3 border-b border-border"><h3 className="font-semibold text-sm text-foreground">History Log</h3></div>
              <div className="px-5 py-3 space-y-3">
                {selected.history.map((h, i) => (
                  <div key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${i === 0 ? "bg-primary" : "bg-border"}`} />
                      {i < selected.history.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm text-foreground">{h.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(h.date)} · {h.by}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Add Machine Modal */}
      {showAddMachine && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Add New Machine</h2>
              <button onClick={() => setShowAddMachine(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Machine ID">
                  <input className={inputCls + " font-mono uppercase"} placeholder="MCH-0XXX"
                    value={newM.id} onChange={(e) => setNewM({ ...newM, id: e.target.value })} />
                </FormField>
                <FormField label="Site">
                  <select className={selectCls} value={newM.site} onChange={(e) => setNewM({ ...newM, site: e.target.value })}>
                    {SITES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </FormField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Factory Group">
                  <input className={inputCls} placeholder="e.g. North America Manufacturing"
                    value={newM.factoryGroup} onChange={(e) => setNewM({ ...newM, factoryGroup: e.target.value })} />
                </FormField>
                <FormField label="Factory">
                  <input className={inputCls} placeholder="e.g. Detroit Assembly"
                    value={newM.factory} onChange={(e) => setNewM({ ...newM, factory: e.target.value })} />
                </FormField>
              </div>
              <FormField label="Machine Name">
                <input className={inputCls} placeholder="e.g. Conveyor Belt Foxtrot"
                  value={newM.name} onChange={(e) => setNewM({ ...newM, name: e.target.value })} />
              </FormField>
              <FormField label="Model / Manufacturer">
                <input className={inputCls} placeholder="e.g. Siemens S7-1500"
                  value={newM.model} onChange={(e) => setNewM({ ...newM, model: e.target.value })} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Install Date">
                  <input type="date" className={inputCls} value={newM.installDate}
                    onChange={(e) => setNewM({ ...newM, installDate: e.target.value })} />
                </FormField>
                <FormField label="Installed By">
                  <input className={inputCls} value={newM.installedBy}
                    onChange={(e) => setNewM({ ...newM, installedBy: e.target.value })} />
                </FormField>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowAddMachine(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={addMachine} disabled={!newM.id || !newM.name || !newM.installDate}
                className="px-5 py-2 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Add Machine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Fault Modal */}
      {showReportFault && selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-foreground">Report Fault</h2>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">{selected.id} — {selected.name}</p>
              </div>
              <button onClick={() => setShowReportFault(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <FormField label="Fault Description">
                <textarea className={inputCls + " resize-none"} rows={4}
                  placeholder="Describe the fault in detail — what you observed, when it occurred, how often…"
                  value={newFault.description} onChange={(e) => setNewFault({ ...newFault, description: e.target.value })} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Severity">
                  <select className={selectCls} value={newFault.severity}
                    onChange={(e) => setNewFault({ ...newFault, severity: e.target.value as FaultSeverity })}>
                    <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                  </select>
                </FormField>
                <FormField label="Category">
                  <select className={selectCls} value={newFault.category}
                    onChange={(e) => setNewFault({ ...newFault, category: e.target.value as IssueCategory })}>
                    {ISSUE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </FormField>
              </div>
              {newFault.severity === "Critical" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-600" />
                  <span><strong>Critical severity</strong> — flagged for immediate manager attention. Stop using the machine if safe to do so.</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowReportFault(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={reportFault} disabled={!newFault.description}
                className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Submit Fault Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Work Orders View ─────────────────────────────────────────────────────────

function WorkOrdersView({
  workOrders, setWorkOrders, machines, users, notifications, setNotifications,
  currentUser, focusId, faultReports,
}: {
  workOrders: WorkOrder[]; setWorkOrders: (w: WorkOrder[]) => void;
  machines: Machine[]; users: AppUser[]; notifications: Notification[];
  setNotifications: (n: Notification[]) => void; currentUser: AppUser;
  focusId?: string; faultReports: FaultReport[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(focusId ?? null);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [newWO, setNewWO] = useState({
    machineId: "", title: "", assignedTo: "",
    priority: "Medium" as "Low" | "Medium" | "High",
  });

  const selected = workOrders.find((w) => w.id === selectedId) ?? null;
  const getUser = (id: string) => users.find((u) => u.id === id);
  const getUserName = (id: string) => getUser(id)?.name ?? id;
  const filtered = workOrders.filter((w) => filterStatus === "All" || w.status === filterStatus);

  const isFinal = (s: WorkOrderStatus) => s === "Verified & Closed" || s === "Cancelled";

  const jumpStatus = (wo: WorkOrder, target: WorkOrderStatus) => {
    const today = new Date().toISOString().split("T")[0];
    setWorkOrders(workOrders.map((w) => w.id === wo.id ? { ...w, status: target, updatedAt: today } : w));
    if (target === "Work Completed") {
      setNotifications([...notifications, {
        id: `n${Date.now()}`, userId: "u5",
        message: `Work Order ${wo.id} has been marked complete. Please verify and approve.`,
        read: false, workOrderId: wo.id, createdAt: today,
      }]);
    }
  };

  const createWorkOrder = () => {
    if (!newWO.machineId || !newWO.title || !newWO.assignedTo) return;
    const id = `WO-${String(workOrders.length + 30).padStart(4, "0")}`;
    const today = new Date().toISOString().split("T")[0];
    const wo: WorkOrder = {
      id, machineId: newWO.machineId, title: newWO.title, description: newWO.description,
      assignedTo: newWO.assignedTo, createdBy: currentUser.id, status: "Assigned",
      createdAt: today, updatedAt: today, priority: newWO.priority, notes: "",
      costEntries: [],
    };
    setWorkOrders([...workOrders, wo]);
    setNotifications([...notifications, {
      id: `n${Date.now()}`, userId: newWO.assignedTo,
      message: `You have been assigned Work Order ${id}: ${newWO.title} on ${newWO.machineId}.`,
      read: false, workOrderId: id, createdAt: today,
    }]);
    setNewWO({ machineId: "", title: "", assignedTo: "", priority: "Medium" });
    setShowCreate(false);
    setSelectedId(id);
  };

  const updateNotes = (wo: WorkOrder, notes: string) =>
    setWorkOrders(workOrders.map((w) => w.id === wo.id ? { ...w, notes } : w));

  const STATUSES = ["All", "Assigned", "Technician En Route", "Technician Arrived", "Work In Progress", "Work Completed", "Verified & Closed", "Cancelled"];

  const flowLabel = (s: WorkOrderStatus) => {
    switch (s) {
      case "Assigned":            return "Assigned";
      case "Technician En Route": return "En Route";
      case "Technician Arrived":  return "On Site";
      case "Work In Progress":    return "In Progress";
      case "Work Completed":      return "Completed";
      case "Verified & Closed":   return "Verified";
      case "Cancelled":           return "Cancelled";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1.5 rounded text-xs font-mono transition-colors ${filterStatus === s ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:border-primary/40"}`}>
              {s}
            </button>
          ))}
        </div>
        {currentUser.role === "Manager" && (
          <button onClick={() => setShowCreate(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors">
            <Plus size={16} />New Work Order
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-2">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No work orders found</p>}
          {filtered.map((wo) => {
            const machine = machines.find((m) => m.id === wo.machineId);
            const isSelected = selectedId === wo.id;
            return (
              <button key={wo.id} onClick={() => setSelectedId(wo.id)}
                className={`w-full text-left rounded-lg border p-4 transition-all ${isSelected ? "border-primary bg-primary text-white shadow-md" : "border-border bg-card hover:border-primary/40"}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`font-mono text-xs font-bold ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>{wo.id}</span>
                  <Badge className={isSelected ? "bg-white/20 text-white" : woStatusColor(wo.status)}>{woStatusIcon(wo.status)} {wo.status}</Badge>
                </div>
                <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-foreground"}`}>{wo.title}</p>
                <p className={`text-xs mt-1 ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>{wo.machineId} · {machine?.site ?? "—"} · {getUserName(wo.assignedTo)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={isSelected ? "bg-white/20 text-white" : priorityColor(wo.priority)}>{wo.priority}</Badge>
                  <span className={`text-xs ${isSelected ? "text-white/60" : "text-muted-foreground"}`}>Updated {formatDate(wo.updatedAt)}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-3">
          {!selected ? (
            <Card className="flex flex-col items-center justify-center h-64 text-center">
              <FileText size={36} className="text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Select a work order to view details</p>
            </Card>
          ) : (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm text-muted-foreground">{selected.id}</span>
                <Badge className={woStatusColor(selected.status)}>{woStatusIcon(selected.status)} {selected.status}</Badge>
                <Badge className={priorityColor(selected.priority)}>{selected.priority}</Badge>
                {selected.faultReportId && (
                  <Badge className="bg-orange-100 text-orange-700"><Flag size={10} />{selected.faultReportId}</Badge>
                )}
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-4">{selected.title}</h2>

              {/* Technician contact card */}
              {selected.assignedTo && (
                <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <User size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{getUserName(selected.assignedTo)}</p>
                    <p className="text-xs text-muted-foreground">{getUser(selected.assignedTo)?.role} · {getUser(selected.assignedTo)?.site}</p>
                  </div>
                  {getUser(selected.assignedTo)?.phone && (
                    <a href={`tel:${getUser(selected.assignedTo)?.phone}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs font-mono font-semibold hover:bg-accent hover:text-white transition-colors shrink-0">
                      <Phone size={13} />{getUser(selected.assignedTo)?.phone}
                    </a>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Machine</p>
                  <p className="text-sm font-medium font-mono text-foreground mt-0.5">{selected.machineId}</p>
                  {(() => {
                    const machine = machines.find((m) => m.id === selected.machineId);
                    const w = machine ? warrantyStatus(machine.installDate) : null;
                    return w ? (
                      <span className={`inline-flex items-center gap-1 text-xs mt-0.5 ${w.active ? "text-green-600" : "text-red-600"}`}>
                        {w.active ? <ShieldCheck size={11} /> : <ShieldAlert size={11} />}Warranty {w.label}
                      </span>
                    ) : null;
                  })()}
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Created By</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{getUserName(selected.createdBy)}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Created</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{formatDate(selected.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Last Updated</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{formatDate(selected.updatedAt)}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5">Description</p>
                <p className="text-sm text-foreground leading-relaxed">{selected.description}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5">Technician Notes</p>
                {currentUser.role === "Technician" && !isFinal(selected.status) ? (
                  <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" rows={3}
                    placeholder="Add notes about findings, parts replaced, actions taken…"
                    value={selected.notes} onChange={(e) => updateNotes(selected, e.target.value)} />
                ) : (
                  <p className="text-sm text-foreground">{selected.notes || <span className="text-muted-foreground italic">No notes yet.</span>}</p>
                )}
              </div>

              {/* Status flow — visual tracker (informational) */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-3">Status Flow</p>
                {selected.status === "Cancelled" ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                    <XCircle size={15} />This work order has been cancelled.
                  </div>
                ) : (
                  <div className="flex items-start overflow-x-auto pb-1">
                    {WO_FLOW.map((s, i) => {
                      const currentIdx = WO_FLOW.indexOf(selected.status);
                      const done = i <= currentIdx;
                      const active = i === currentIdx;
                      return (
                        <div key={s} className="flex items-center shrink-0">
                          <div className="flex flex-col items-center w-14">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${done ? "bg-primary text-white" : "bg-muted border border-border text-muted-foreground"} ${active ? "ring-2 ring-primary/30 ring-offset-1" : ""}`}>
                              {i < currentIdx ? <CheckCircle2 size={13} /> : i + 1}
                            </div>
                            <span className={`text-[10px] font-mono mt-1 text-center leading-tight ${done ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                              {flowLabel(s)}
                            </span>
                          </div>
                          {i < WO_FLOW.length - 1 && (
                            <div className={`h-0.5 w-4 shrink-0 mb-3 ${i < currentIdx ? "bg-primary" : "bg-border"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Direct-action buttons — jump to any status directly */}
              {(() => {
                const role = currentUser.role;
                const s = selected.status;
                const isTech  = role === "Technician";
                const isMgr   = role === "Manager";
                const isOwner = role === "Owner";

                type ActionBtn = { label: string; icon: React.ReactNode; target: WorkOrderStatus; cls: string };
                const mainBtns: ActionBtn[] = [];
                let cancelBtn: ActionBtn | null = null;
                let reopenBtn: ActionBtn | null = null;

                if ((isTech || isMgr) && !isFinal(s)) {
                  if (s !== "Technician En Route")
                    mainBtns.push({ label: "En Route",   icon: <Truck size={15} />,        target: "Technician En Route",
                      cls: "bg-violet-600 hover:bg-violet-700 text-white" });
                  if (s !== "Technician Arrived")
                    mainBtns.push({ label: "Check In",   icon: <Navigation size={15} />,   target: "Technician Arrived",
                      cls: "bg-teal-600 hover:bg-teal-700 text-white" });
                  if (s !== "Work In Progress")
                    mainBtns.push({ label: "Start Work", icon: <Wrench size={15} />,       target: "Work In Progress",
                      cls: "bg-blue-600 hover:bg-blue-700 text-white" });
                  if (s !== "Work Completed")
                    mainBtns.push({ label: "Complete",   icon: <CheckCircle2 size={15} />, target: "Work Completed",
                      cls: "bg-orange-500 hover:bg-orange-600 text-white" });
                }
                if ((isOwner || isMgr) && !isFinal(s))
                  mainBtns.push({ label: "Verify & Close", icon: <ShieldCheck size={15} />, target: "Verified & Closed",
                    cls: "bg-green-600 hover:bg-green-700 text-white" });

                if (isMgr && !isFinal(s))
                  cancelBtn = { label: "Cancel WO", icon: <XCircle size={15} />, target: "Cancelled",
                    cls: "border border-red-300 bg-card text-red-600 hover:bg-red-50" };

                if ((isMgr || isOwner) && isFinal(s))
                  reopenBtn = { label: "Re-Open", icon: <ArrowRight size={15} />, target: "Assigned",
                    cls: "border border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/30" };

                if (mainBtns.length === 0 && !cancelBtn && !reopenBtn) return null;

                // Pair main buttons into rows of 2 for the grid
                const rows: ActionBtn[][] = [];
                for (let i = 0; i < mainBtns.length; i += 2)
                  rows.push(mainBtns.slice(i, i + 2));

                return (
                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Actions</p>

                    {rows.map((row, ri) => (
                      <div key={ri} className="grid grid-cols-2 gap-2">
                        {row.map((a) => (
                          <button key={a.target} onClick={() => jumpStatus(selected, a.target)}
                            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${a.cls}`}>
                            {a.icon}{a.label}
                          </button>
                        ))}
                        {row.length === 1 && <div />}
                      </div>
                    ))}

                    {(cancelBtn || reopenBtn) && (
                      <div className="grid grid-cols-2 gap-2">
                        {(cancelBtn ?? reopenBtn) && (
                          <button onClick={() => jumpStatus(selected, (cancelBtn ?? reopenBtn)!.target)}
                            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${(cancelBtn ?? reopenBtn)!.cls}`}>
                            {(cancelBtn ?? reopenBtn)!.icon}{(cancelBtn ?? reopenBtn)!.label}
                          </button>
                        )}
                        <div />
                      </div>
                    )}
                  </div>
                );
              })()}
            </Card>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Create Work Order</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <FormField label="Machine ID">
                <select className={selectCls} value={newWO.machineId} onChange={(e) => setNewWO({ ...newWO, machineId: e.target.value })}>
                  <option value="">Select machine…</option>
                  {machines.map((m) => <option key={m.id} value={m.id}>{m.id} — {m.name} ({m.site})</option>)}
                </select>
              </FormField>
              <FormField label="Title">
                <input className={inputCls} placeholder="Brief description of the issue…"
                  value={newWO.title} onChange={(e) => setNewWO({ ...newWO, title: e.target.value })} />
              </FormField>
              <FormField label="Description">
                <textarea className={inputCls + " resize-none"} rows={3}
                  placeholder="Detailed instructions for the technician…"
                  value={newWO.description} onChange={(e) => setNewWO({ ...newWO, description: e.target.value })} />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Assign To">
                  <select className={selectCls} value={newWO.assignedTo} onChange={(e) => setNewWO({ ...newWO, assignedTo: e.target.value })}>
                    <option value="">Select technician…</option>
                    {users.filter((u) => u.role === "Technician").map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.site})</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Priority">
                  <select className={selectCls} value={newWO.priority} onChange={(e) => setNewWO({ ...newWO, priority: e.target.value as "Low" | "Medium" | "High" })}>
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                </FormField>
              </div>
              {newWO.assignedTo && (() => {
                const tech = users.find((u) => u.id === newWO.assignedTo);
                return tech?.phone ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10 text-sm">
                    <Phone size={13} className="text-primary" />
                    <span className="text-muted-foreground">Technician mobile:</span>
                    <span className="font-mono font-semibold text-primary">{tech.phone}</span>
                  </div>
                ) : null;
              })()}
              {newWO.machineId && (() => {
                const machine = machines.find((m) => m.id === newWO.machineId);
                if (!machine) return null;
                const w = warrantyStatus(machine.installDate);
                return (
                  <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${w.active ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                    {w.active ? <ShieldCheck size={16} className="mt-0.5 shrink-0" /> : <ShieldAlert size={16} className="mt-0.5 shrink-0" />}
                    <span><strong>Warranty {w.label}</strong> — {w.active ? `Expires ${formatDate(w.expires)}` : `Expired ${formatDate(w.expires)}. Costs may not be covered.`}</span>
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={createWorkOrder} disabled={!newWO.machineId || !newWO.title || !newWO.assignedTo}
                className="px-5 py-2 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Create & Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Fault Reports View ───────────────────────────────────────────────────────

function FaultReportsView({
  faultReports, setFaultReports, machines, users, workOrders, setWorkOrders,
  notifications, setNotifications, currentUser, onNavigate, focusId,
}: {
  faultReports: FaultReport[]; setFaultReports: (f: FaultReport[]) => void;
  machines: Machine[]; users: AppUser[]; workOrders: WorkOrder[];
  setWorkOrders: (w: WorkOrder[]) => void; notifications: Notification[];
  setNotifications: (n: Notification[]) => void; currentUser: AppUser;
  onNavigate: (view: string, id?: string) => void; focusId?: string;
}) {
  const [filter, setFilter] = useState<string>("All");
  const [selectedId, setSelectedId] = useState<string | null>(focusId ?? null);
  const [showAssign, setShowAssign] = useState(false);
  const [assignData, setAssignData] = useState({ technicianId: "", priority: "High" as "Low" | "Medium" | "High" });

  const selected = faultReports.find((f) => f.id === selectedId) ?? null;
  const getMachine = (id: string) => machines.find((m) => m.id === id);
  const getUserName = (id: string) => users.find((u) => u.id === id)?.name ?? id;

  const filtered = useMemo(() => {
    const base = filter === "All" ? faultReports : faultReports.filter((f) => f.status === filter);
    return [...base].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [faultReports, filter]);

  const dismiss = (f: FaultReport) => {
    setFaultReports(faultReports.map((fr) => fr.id === f.id ? { ...fr, status: "Dismissed" } : fr));
  };

  const createWOFromFault = () => {
    if (!selected || !assignData.technicianId) return;
    const id = `WO-${String(workOrders.length + 30).padStart(4, "0")}`;
    const today = new Date().toISOString().split("T")[0];
    const wo: WorkOrder = {
      id, machineId: selected.machineId,
      title: selected.description.slice(0, 60),
      description: selected.description,
      assignedTo: assignData.technicianId, createdBy: currentUser.id,
      status: "Assigned", createdAt: today, updatedAt: today,
      priority: assignData.priority, notes: "", faultReportId: selected.id,
      costEntries: [],
    };
    setWorkOrders([...workOrders, wo]);
    setFaultReports(faultReports.map((f) => f.id === selected.id ? { ...f, status: "Converted", convertedToWO: id } : f));
    setNotifications([...notifications, {
      id: `n${Date.now()}`, userId: assignData.technicianId,
      message: `You have been assigned Work Order ${id} (from Fault Report ${selected.id}) on ${selected.machineId}.`,
      read: false, workOrderId: id, createdAt: today,
    }]);
    setShowAssign(false);
    setAssignData({ technicianId: "", priority: "High" });
    onNavigate("workorders", id);
  };

  const stats = {
    open:      faultReports.filter((f) => f.status === "Open").length,
    critical:  faultReports.filter((f) => f.status === "Open" && f.severity === "Critical").length,
    high:      faultReports.filter((f) => f.status === "Open" && f.severity === "High").length,
    converted: faultReports.filter((f) => f.status === "Converted").length,
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Open Faults</p>
          <p className={`text-2xl font-bold mt-0.5 ${stats.open > 0 ? "text-red-600" : "text-green-600"}`}>{stats.open}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Critical</p>
          <p className={`text-2xl font-bold mt-0.5 ${stats.critical > 0 ? "text-red-700" : "text-muted-foreground"}`}>{stats.critical}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">High Priority</p>
          <p className={`text-2xl font-bold mt-0.5 ${stats.high > 0 ? "text-orange-600" : "text-muted-foreground"}`}>{stats.high}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Converted to WO</p>
          <p className="text-2xl font-bold text-green-600 mt-0.5">{stats.converted}</p>
        </Card>
      </div>

      <div className="flex gap-1 flex-wrap">
        {["All", "Open", "Converted", "Dismissed"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${filter === s ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:border-primary/40"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-2">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No fault reports found</p>}
          {filtered.map((f) => {
            const isSelected = selectedId === f.id;
            return (
              <button key={f.id} onClick={() => setSelectedId(f.id)}
                className={`w-full text-left rounded-lg border p-4 transition-all ${isSelected ? "border-primary bg-primary text-white shadow-md" : "border-border bg-card hover:border-primary/40"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-mono text-xs font-bold ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>{f.id}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge className={isSelected ? "bg-white/20 text-white" : severityColor(f.severity)}>{f.severity}</Badge>
                    <Badge className={isSelected ? "bg-white/20 text-white" :
                      f.status === "Open" ? "bg-red-100 text-red-700" :
                      f.status === "Converted" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                      {f.status}
                    </Badge>
                  </div>
                </div>
                <p className={`text-xs font-mono font-semibold ${isSelected ? "text-white/90" : "text-primary"}`}>{f.machineId}</p>
                <p className={`text-sm mt-0.5 line-clamp-2 ${isSelected ? "text-white/80" : "text-foreground"}`}>{f.description}</p>
                <p className={`text-xs mt-1.5 ${isSelected ? "text-white/60" : "text-muted-foreground"}`}>{formatDate(f.createdAt)} · {getUserName(f.reportedBy)}</p>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-3">
          {!selected ? (
            <Card className="flex flex-col items-center justify-center h-64 text-center">
              <Flag size={36} className="text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Select a fault report to view details</p>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-muted-foreground">{selected.id}</span>
                      <Badge className={severityColor(selected.severity)}>{selected.severity}</Badge>
                      <Badge className={
                        selected.status === "Open" ? "bg-red-100 text-red-700" :
                        selected.status === "Converted" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                        {selected.status}
                      </Badge>
                    </div>
                    <h2 className="font-bold text-primary font-mono">{selected.machineId}</h2>
                    <p className="text-sm text-muted-foreground">{getMachine(selected.machineId)?.name} · {getMachine(selected.machineId)?.site}</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono font-medium shrink-0"
                    style={{ background: CATEGORY_COLORS[selected.category] + "18", color: CATEGORY_COLORS[selected.category] }}>
                    {selected.category}
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-muted/40 border border-border mb-4">
                  <p className="text-sm text-foreground leading-relaxed">{selected.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Reported By</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{getUserName(selected.reportedBy)}</p>
                    <p className="text-xs text-muted-foreground">{users.find((u) => u.id === selected.reportedBy)?.role}</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Date Reported</p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{formatDate(selected.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Warranty</p>
                    {(() => {
                      const machine = getMachine(selected.machineId);
                      if (!machine) return <p className="text-sm text-muted-foreground mt-0.5">—</p>;
                      const w = warrantyStatus(machine.installDate);
                      return (
                        <span className={`inline-flex items-center gap-1 text-sm font-medium mt-0.5 ${w.active ? "text-green-600" : "text-red-600"}`}>
                          {w.active ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}{w.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {selected.convertedToWO && (
                  <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-green-600" />
                    <span className="text-sm text-foreground">Converted to</span>
                    <button onClick={() => onNavigate("workorders", selected.convertedToWO)}
                      className="font-mono text-sm text-accent font-semibold hover:text-amber-600 transition-colors">
                      {selected.convertedToWO} →
                    </button>
                  </div>
                )}

                {selected.status === "Open" && currentUser.role === "Manager" && (
                  <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                    <button onClick={() => setShowAssign(true)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent text-white rounded-lg font-semibold text-sm hover:bg-amber-600 transition-colors">
                      <ArrowRight size={16} />Create Work Order from Fault
                    </button>
                    <button onClick={() => dismiss(selected)}
                      className="px-4 py-2.5 border border-border text-muted-foreground rounded-lg text-sm hover:text-foreground hover:border-foreground/30 transition-colors">
                      Dismiss
                    </button>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

      {showAssign && selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-xl shadow-2xl border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-foreground">Create Work Order</h2>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">From {selected.id} · {selected.machineId}</p>
              </div>
              <button onClick={() => setShowAssign(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="p-3 rounded-lg bg-muted/40 border border-border">
                <p className="text-xs font-mono text-muted-foreground mb-1">Fault Description (pre-filled)</p>
                <p className="text-sm text-foreground line-clamp-3">{selected.description}</p>
              </div>
              <FormField label="Assign To">
                <select className={selectCls} value={assignData.technicianId}
                  onChange={(e) => setAssignData({ ...assignData, technicianId: e.target.value })}>
                  <option value="">Select technician…</option>
                  {users.filter((u) => u.role === "Technician").map((u) => (
                    <option key={u.id} value={u.id}>{u.name} — {u.site}{u.phone ? ` · ${u.phone}` : ""}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Priority">
                <select className={selectCls} value={assignData.priority}
                  onChange={(e) => setAssignData({ ...assignData, priority: e.target.value as "Low" | "Medium" | "High" })}>
                  <option>Low</option><option>Medium</option><option>High</option>
                </select>
              </FormField>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowAssign(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              <button onClick={createWOFromFault} disabled={!assignData.technicianId}
                className="px-5 py-2 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Create & Assign Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Notifications View ───────────────────────────────────────────────────────

function NotificationsView({
  notifications, setNotifications, currentUser, onNavigate,
}: {
  notifications: Notification[]; setNotifications: (n: Notification[]) => void;
  currentUser: AppUser; onNavigate: (view: string, id?: string) => void;
}) {
  const mine = notifications.filter((n) => n.userId === currentUser.id);
  const markRead = (id: string) => setNotifications(notifications.map((n) => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications(notifications.map((n) => n.userId === currentUser.id ? { ...n, read: true } : n));
  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{mine.filter((n) => !n.read).length} unread</p>
        {mine.some((n) => !n.read) && (
          <button onClick={markAllRead} className="text-xs font-mono text-accent hover:text-amber-600 transition-colors">Mark all as read</button>
        )}
      </div>
      {mine.length === 0 && (
        <Card className="flex flex-col items-center justify-center h-48 text-center">
          <Bell size={32} className="text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No notifications for this account</p>
        </Card>
      )}
      <div className="space-y-2">
        {mine.map((n) => (
          <div key={n.id} className={`rounded-lg border p-4 cursor-pointer transition-all ${n.read ? "bg-card border-border" : "bg-amber-50 border-amber-200"}`}
            onClick={() => { markRead(n.id); onNavigate("workorders", n.workOrderId); }}>
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.read ? "bg-transparent" : "bg-accent"}`} />
              <div className="flex-1">
                <p className={`text-sm ${n.read ? "text-muted-foreground" : "text-foreground font-medium"}`}>{n.message}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-muted-foreground font-mono">{formatDate(n.createdAt)}</span>
                  <span className="text-xs text-accent font-mono">View work order →</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Photo Lightbox ───────────────────────────────────────────────────────────

function PhotoLightbox({ photos, startIndex, onClose }: { photos: RepairPhoto[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  const photo = photos[idx];
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"><X size={16} /></button>
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <img src={photo.url} alt={photo.caption} className="w-full max-h-[70vh] object-cover bg-gray-800" />
          <div className="px-5 py-3 flex items-center gap-3">
            <Badge className={photo.type === "before" ? "bg-red-900/60 text-red-300" : "bg-green-900/60 text-green-300"}>
              {photo.type === "before" ? "Before" : "After"}
            </Badge>
            <p className="text-sm text-gray-300 flex-1">{photo.caption}</p>
            <span className="text-xs text-gray-500 font-mono shrink-0">{idx + 1} / {photos.length}</span>
          </div>
        </div>
        {photos.length > 1 && (
          <>
            <button onClick={() => setIdx((idx - 1 + photos.length) % photos.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"><ChevronLeft size={20} /></button>
            <button onClick={() => setIdx((idx + 1) % photos.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"><ChevronRight size={20} /></button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Repair Records View ──────────────────────────────────────────────────────

function RepairRecordsView({ repairRecords, machines, users, focusId }: {
  repairRecords: RepairRecord[]; machines: Machine[]; users: AppUser[]; focusId?: string;
}) {
  const [filterMachine, setFilterMachine] = useState<string>(focusId ?? "All");
  const [selectedRecord, setSelectedRecord] = useState<RepairRecord | null>(null);
  const [lightbox, setLightbox] = useState<{ photos: RepairPhoto[]; startIndex: number } | null>(null);
  const getMachineName = (id: string) => machines.find((m) => m.id === id)?.name ?? id;
  const getUserName = (id: string) => users.find((u) => u.id === id)?.name ?? id;
  const filtered = useMemo(() => {
    const records = filterMachine === "All" ? repairRecords : repairRecords.filter((r) => r.machineId === filterMachine);
    return [...records].sort((a, b) => b.date.localeCompare(a.date));
  }, [repairRecords, filterMachine]);
  const totalCost = filtered.reduce((s, r) => s + r.totalCost, 0);
  const totalParts = filtered.reduce((s, r) => s + r.partsReplaced.reduce((ps, p) => ps + p.cost, 0), 0);

  return (
    <div className="space-y-5">
      {lightbox && <PhotoLightbox photos={lightbox.photos} startIndex={lightbox.startIndex} onClose={() => setLightbox(null)} />}
      <div className="flex items-center gap-1 flex-wrap">
        <button onClick={() => setFilterMachine("All")} className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${filterMachine === "All" ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:border-primary/40"}`}>All Machines</button>
        {machines.map((m) => (
          <button key={m.id} onClick={() => setFilterMachine(m.id)} className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${filterMachine === m.id ? "bg-primary text-white" : "bg-card border border-border text-muted-foreground hover:border-primary/40"}`}>{m.id}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4"><p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Records</p><p className="text-2xl font-bold text-primary mt-0.5">{filtered.length}</p></Card>
        <Card className="p-4"><p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Total Cost</p><p className="text-2xl font-bold text-accent mt-0.5">{fmtCurrency(totalCost)}</p></Card>
        <Card className="p-4"><p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Parts Cost</p><p className="text-2xl font-bold text-foreground mt-0.5">{fmtCurrency(totalParts)}</p></Card>
        <Card className="p-4"><p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Labor Cost</p><p className="text-2xl font-bold text-foreground mt-0.5">{fmtCurrency(totalCost - totalParts)}</p></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-2">
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No repair records found</p>}
          {filtered.map((r) => {
            const isSelected = selectedRecord?.id === r.id;
            return (
              <button key={r.id} onClick={() => setSelectedRecord(r)} className={`w-full text-left rounded-lg border p-4 transition-all ${isSelected ? "border-primary bg-primary text-white shadow-md" : "border-border bg-card hover:border-primary/40"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-mono text-xs font-bold ${isSelected ? "text-white/80" : "text-muted-foreground"}`}>{r.id}</span>
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>{r.issueCategory}</span>
                </div>
                <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-foreground"}`}>{r.machineId} — {getMachineName(r.machineId)}</p>
                <p className={`text-xs mt-0.5 line-clamp-1 ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>{r.issueDescription}</p>
                <div className={`flex items-center justify-between mt-2 text-xs ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>
                  <span>{formatDate(r.date)}</span>
                  <span className={`font-mono font-semibold ${isSelected ? "text-white" : "text-accent"}`}>{fmtCurrency(r.totalCost)}</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="lg:col-span-3">
          {!selectedRecord ? (
            <Card className="flex flex-col items-center justify-center h-64 text-center"><Camera size={36} className="text-muted-foreground/40 mb-3" /><p className="text-sm text-muted-foreground">Select a repair record to view details and photos</p></Card>
          ) : (
            <div className="space-y-4">
              <Card className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-muted-foreground">{selectedRecord.id}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium" style={{ background: CATEGORY_COLORS[selectedRecord.issueCategory] + "20", color: CATEGORY_COLORS[selectedRecord.issueCategory] }}>{selectedRecord.issueCategory}</span>
                    </div>
                    <h2 className="text-base font-bold text-primary font-mono">{selectedRecord.machineId}</h2>
                    <p className="text-sm text-foreground">{getMachineName(selectedRecord.machineId)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Total Cost</p>
                    <p className="text-2xl font-bold text-accent">{fmtCurrency(selectedRecord.totalCost)}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1.5">Issue Description</p>
                  <p className="text-sm text-foreground leading-relaxed">{selectedRecord.issueDescription}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                  <div><p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Date</p><p className="text-sm font-medium text-foreground mt-0.5">{formatDate(selectedRecord.date)}</p></div>
                  <div><p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Technician</p><p className="text-sm font-medium text-foreground mt-0.5">{getUserName(selectedRecord.technicianId)}</p></div>
                  <div><p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Work Order</p><p className="text-sm font-medium text-foreground mt-0.5 font-mono">{selectedRecord.workOrderId}</p></div>
                </div>
              </Card>
              <Card className="overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center gap-2"><Package size={15} className="text-muted-foreground" /><h3 className="font-semibold text-sm text-foreground">Parts Replaced</h3></div>
                {selectedRecord.partsReplaced.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-muted-foreground italic">No parts replaced (labor/software only)</p>
                ) : (
                  <div>
                    <div className="divide-y divide-border">
                      {selectedRecord.partsReplaced.map((p, i) => (
                        <div key={i} className="px-5 py-3 flex items-center justify-between gap-3">
                          <div><p className="text-sm font-medium text-foreground">{p.name}</p><p className="text-xs font-mono text-muted-foreground">{p.partNumber}</p></div>
                          <span className="font-mono text-sm font-semibold text-foreground shrink-0">{fmtCurrency(p.cost)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="px-5 py-3 border-t border-border flex justify-between text-sm bg-muted/30">
                      <div><span className="text-muted-foreground">Parts: </span><span className="font-mono font-semibold">{fmtCurrency(selectedRecord.partsReplaced.reduce((s, p) => s + p.cost, 0))}</span></div>
                      <div><span className="text-muted-foreground">Labor: </span><span className="font-mono font-semibold">{fmtCurrency(selectedRecord.laborCost)}</span></div>
                    </div>
                  </div>
                )}
              </Card>
              <Card className="overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center gap-2"><Camera size={15} className="text-muted-foreground" /><h3 className="font-semibold text-sm text-foreground">Photo Gallery</h3><span className="text-xs text-muted-foreground font-mono ml-auto">{selectedRecord.photos.length} photos</span></div>
                {selectedRecord.photos.length === 0 ? <p className="px-5 py-4 text-sm text-muted-foreground italic">No photos attached</p> : (
                  <div className="p-4">
                    {selectedRecord.photos.filter((p) => p.type === "before").length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Before / Damage</p>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedRecord.photos.filter((p) => p.type === "before").map((photo) => {
                            const globalIdx = selectedRecord.photos.indexOf(photo);
                            return (
                              <button key={photo.id} onClick={() => setLightbox({ photos: selectedRecord.photos, startIndex: globalIdx })} className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 group">
                                <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end"><p className="text-xs text-white bg-black/60 px-2 py-1 w-full truncate opacity-0 group-hover:opacity-100 transition-opacity">{photo.caption}</p></div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {selectedRecord.photos.filter((p) => p.type === "after").length > 0 && (
                      <div>
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />After / Repaired</p>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedRecord.photos.filter((p) => p.type === "after").map((photo) => {
                            const globalIdx = selectedRecord.photos.indexOf(photo);
                            return (
                              <button key={photo.id} onClick={() => setLightbox({ photos: selectedRecord.photos, startIndex: globalIdx })} className="relative aspect-video rounded-lg overflow-hidden bg-gray-200 group">
                                <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end"><p className="text-xs text-white bg-black/60 px-2 py-1 w-full truncate opacity-0 group-hover:opacity-100 transition-opacity">{photo.caption}</p></div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Analytics View ───────────────────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-primary text-white text-xs rounded-lg px-3 py-2 shadow-lg">
      <p className="font-mono font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? "#F59E0B" }}>{p.name}: {typeof p.value === "number" && p.name.toLowerCase().includes("cost") ? fmtCurrency(p.value) : p.value}</p>
      ))}
    </div>
  );
};

function AnalyticsView({ repairRecords, machines }: { repairRecords: RepairRecord[]; machines: Machine[] }) {
  const [year] = useState(2024);
  const yearRecords = repairRecords.filter((r) => r.date.startsWith(String(year)));
  const totalCost = yearRecords.reduce((s, r) => s + r.totalCost, 0);
  const totalRepairs = yearRecords.length;
  const avgCost = totalRepairs ? Math.round(totalCost / totalRepairs) : 0;
  const uniqueMachines = new Set(yearRecords.map((r) => r.machineId)).size;
  const monthlyData = MONTHS.map((month, i) => {
    const mo = String(i + 1).padStart(2, "0");
    const recs = yearRecords.filter((r) => r.date.startsWith(`${year}-${mo}`));
    return { month, cost: recs.reduce((s, r) => s + r.totalCost, 0), repairs: recs.length };
  });
  const machineData = machines.map((m) => {
    const recs = yearRecords.filter((r) => r.machineId === m.id);
    return { machine: m.id, repairs: recs.length, cost: recs.reduce((s, r) => s + r.totalCost, 0) };
  }).sort((a, b) => b.repairs - a.repairs);
  const categories: IssueCategory[] = ["Mechanical", "Electrical", "Software / Firmware", "Hydraulic", "Preventive Maintenance"];
  const categoryData = categories.map((cat) => {
    const recs = yearRecords.filter((r) => r.issueCategory === cat);
    return { name: cat, value: recs.length, cost: recs.reduce((s, r) => s + r.totalCost, 0) };
  }).filter((c) => c.value > 0);
  const issueTable = [...yearRecords].sort((a, b) => b.totalCost - a.totalCost);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center"><TrendingUp size={16} className="text-primary" /></div>
          <div>
            <h2 className="font-bold text-foreground text-lg leading-tight">Annual Report — {year}</h2>
            <p className="text-xs font-mono text-muted-foreground">All Sites · Year-End Summary</p>
          </div>
        </div>
        <div className="ml-auto"><span className="text-xs font-mono px-3 py-1.5 bg-primary text-white rounded-lg">FY {year}</span></div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5"><p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Total Repairs</p><p className="text-3xl font-bold text-primary mt-1">{totalRepairs}</p><p className="text-xs text-muted-foreground mt-1">Work orders completed</p></Card>
        <Card className="p-5"><p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Machines Repaired</p><p className="text-3xl font-bold text-foreground mt-1">{uniqueMachines}</p><p className="text-xs text-muted-foreground mt-1">of {machines.length} in fleet</p></Card>
        <Card className="p-5"><p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Total Cost</p><p className="text-3xl font-bold text-accent mt-1">{fmtCurrency(totalCost)}</p><p className="text-xs text-muted-foreground mt-1">Parts + labor</p></Card>
        <Card className="p-5"><p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Avg Cost / Repair</p><p className="text-3xl font-bold text-foreground mt-1">{fmtCurrency(avgCost)}</p><p className="text-xs text-muted-foreground mt-1">Per incident</p></Card>
      </div>
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-border"><h3 className="font-semibold text-foreground">Monthly Repair Cost Trend</h3><p className="text-xs text-muted-foreground font-mono mt-0.5">Total spend per month — {year}</p></div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => v === 0 ? "$0" : `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", fill: "#6B7280" }} axisLine={false} tickLine={false} width={44} />
              <Tooltip content={<CustomTooltip />} />
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
                <XAxis type="number" tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="machine" width={72} tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", fill: "#1A2942", fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar key="repairs" dataKey="repairs" name="Repairs" fill="#1A2942" radius={[0, 3, 3, 0]} label={{ position: "right", fontSize: 11, fontFamily: "JetBrains Mono, monospace", fill: "#6B7280", formatter: (v: number) => v > 0 ? v : "" }} />
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
                <Tooltip formatter={(v: number, name: string) => [v + " repairs", name]} contentStyle={{ fontSize: 12, fontFamily: "JetBrains Mono, monospace", background: "#1A2942", border: "none", borderRadius: 8, color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 w-full mt-2">
              {categoryData.map((c) => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: CATEGORY_COLORS[c.name as IssueCategory] }} />
                  <span className="text-xs text-foreground flex-1 truncate">{c.name}</span>
                  <span className="text-xs font-mono text-muted-foreground">{c.value}x</span>
                  <span className="text-xs font-mono text-accent">{fmtCurrency(c.cost)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-border"><h3 className="font-semibold text-foreground">Repair Log — {year}</h3><p className="text-xs text-muted-foreground font-mono mt-0.5">All completed repair records, sorted by cost</p></div>
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
                  <td className="px-3 py-3 hidden md:table-cell"><span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: CATEGORY_COLORS[r.issueCategory] + "18", color: CATEGORY_COLORS[r.issueCategory] }}>{r.issueCategory}</span></td>
                  <td className="px-3 py-3 hidden lg:table-cell max-w-[220px]"><p className="text-xs text-foreground truncate">{r.issueDescription.slice(0, 70)}…</p></td>
                  <td className="px-3 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">{formatDate(r.date)}</td>
                  <td className="px-5 py-3 text-right font-mono text-sm font-semibold text-accent">{fmtCurrency(r.totalCost)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="border-t-2 border-border bg-muted/30"><td colSpan={5} className="px-5 py-3 text-xs font-mono font-semibold text-foreground uppercase tracking-wider">Total</td><td className="px-5 py-3 text-right font-mono font-bold text-accent">{fmtCurrency(totalCost)}</td></tr></tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── Finance View ─────────────────────────────────────────────────────────────

const COST_CATEGORIES: CostCategory[] = ["Transportation", "Accommodation", "Labor", "Spare Part", "Others"];

const COST_CATEGORY_META: Record<CostCategory, { color: string; bg: string; text: string }> = {
  Transportation: { color: "#F59E0B", bg: "bg-amber-100",    text: "text-amber-700" },
  Accommodation:  { color: "#8B5CF6", bg: "bg-violet-100",   text: "text-violet-700" },
  Labor:          { color: "#3B82F6", bg: "bg-blue-100",     text: "text-blue-700" },
  "Spare Part":   { color: "#EC4899", bg: "bg-pink-100",     text: "text-pink-700" },
  Others:         { color: "#10B981", bg: "bg-teal-100",     text: "text-teal-700" },
};

function FinanceView({
  repairRecords, workOrders, setWorkOrders, machines, users, currentUser,
}: {
  repairRecords: RepairRecord[]; workOrders: WorkOrder[];
  setWorkOrders: (w: WorkOrder[]) => void; machines: Machine[];
  users: AppUser[]; currentUser: AppUser;
}) {
  const [selectedWOId, setSelectedWOId] = useState<string | null>(workOrders[0]?.id ?? null);
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

  const canEdit = currentUser.role === "Finance" || currentUser.role === "Manager";

  const selectedWO = workOrders.find((w) => w.id === selectedWOId) ?? null;
  const getMachine = (id: string) => machines.find((m) => m.id === id);
  const getUserName = (id: string) => users.find((u) => u.id === id)?.name ?? id;

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
    return workOrders.flatMap((w) => w.costEntries).filter(e => e.date.startsWith(ym)).length;
  }, [workOrders, selectedYear, selectedMonth]);

  const grandTotals = useMemo(() => {
    const ym = `${selectedYear}-${selectedMonth}`;
    const all = workOrders.flatMap((w) => w.costEntries).filter(e => e.date.startsWith(ym));
    return {
      transportation: all.filter((e) => e.category === "Transportation").reduce((s, e) => s + e.amount, 0),
      accommodation:  all.filter((e) => e.category === "Accommodation").reduce((s, e) => s + e.amount, 0),
      labor:          all.filter((e) => e.category === "Labor").reduce((s, e) => s + e.amount, 0),
      sparePart:      all.filter((e) => e.category === "Spare Part").reduce((s, e) => s + e.amount, 0),
      others:         all.filter((e) => e.category === "Others").reduce((s, e) => s + e.amount, 0),
      grand:          all.reduce((s, e) => s + e.amount, 0),
    };
  }, [workOrders, selectedYear, selectedMonth]);

  const monthlyChartData = useMemo(() => {
    return MONTHS.map((month, mi) => {
      const mo = String(mi + 1).padStart(2, "0");
      const entries = workOrders.flatMap((w) =>
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
  }, [workOrders, selectedYear]);

  const filteredWOs = useMemo(() => {
    const q = woSearch.toLowerCase();
    const ym = `${selectedYear}-${selectedMonth}`;
    return workOrders.filter((w) => {
      const matchesSearch = w.id.toLowerCase().includes(q) || w.machineId.toLowerCase().includes(q) || w.title.toLowerCase().includes(q);
      const matchesMonth = w.createdAt.startsWith(ym) || w.updatedAt.startsWith(ym) || w.costEntries.some(e => e.date.startsWith(ym));
      return matchesSearch && matchesMonth;
    });
  }, [workOrders, woSearch, selectedYear, selectedMonth]);

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

  const saveEntry = () => {
    if (!selectedWO) return;

    if (editingEntry) {
      if (!editForm.quantity || !editForm.unitPrice) return;
      const qty = parseFloat(editForm.quantity);
      const up = parseFloat(editForm.unitPrice);
      if (isNaN(qty) || qty <= 0 || isNaN(up) || up < 0) return;
      const amt = qty * up;

      setWorkOrders(workOrders.map((w) => w.id === selectedWO.id
        ? { ...w, costEntries: w.costEntries.map((e) => e.id === editingEntry.id
            ? { ...e, category: editForm.category, amount: amt, quantity: qty, unitPrice: up, details: editForm.details.trim(), date: editForm.date }
            : e) }
        : w));
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
      
      setWorkOrders(workOrders.map((w) => w.id === selectedWO.id
        ? { ...w, costEntries: [...w.costEntries, ...newCostEntries] }
        : w));
    }
    setShowEntryModal(false);
  };

  const deleteEntry = (entryId: string) => {
    if (!selectedWO) return;
    setWorkOrders(workOrders.map((w) => w.id === selectedWO.id
      ? { ...w, costEntries: w.costEntries.filter((e) => e.id !== entryId) }
      : w));
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
              <Tooltip content={<CustomTooltip />} />
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
            {filteredWOs.map((wo) => {
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
                    <span className={`font-mono font-bold ${isSelected ? "text-white" : total > 0 ? "text-accent" : "text-muted-foreground"}`}>
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
                    <p className="text-2xl font-bold text-accent mt-0.5">{fmtCurrency(woTotal(selectedWO))}</p>
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
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors">
                      <Plus size={13} />Add Entry
                    </button>
                  )}
                </div>

                {selectedWO.costEntries.filter(e => e.date.startsWith(`${selectedYear}-${selectedMonth}`)).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <DollarSign size={28} className="text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No cost entries for {MONTHS[parseInt(selectedMonth, 10) - 1]} {selectedYear}</p>
                    {canEdit && (
                      <button onClick={openAdd} className="mt-3 text-xs font-mono text-accent hover:text-amber-600 transition-colors">
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
                          <td className="px-4 py-3 text-right font-mono font-bold text-accent">{fmtCurrency(woTotal(selectedWO))}</td>
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
                              <td className="px-3 py-2 text-right font-mono font-semibold text-accent text-xs">
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
                          className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-amber-600 transition-colors px-2 py-1">
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
                className="px-5 py-2 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {editingEntry ? "Save Changes" : "Add Entries"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

type ViewName = "dashboard" | "machines" | "workorders" | "faults" | "notifications" | "repairs" | "analytics" | "finance";

export default function App() {
  const [machines, setMachines] = useState<Machine[]>(MACHINES_SEED);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(WORK_ORDERS_SEED);
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS_SEED);
  const [repairRecords] = useState<RepairRecord[]>(REPAIR_RECORDS_SEED);
  const [faultReports, setFaultReports] = useState<FaultReport[]>(FAULT_REPORTS_SEED);
  const [currentUser, setCurrentUser] = useState<AppUser>(USERS[0]);
  const [view, setView] = useState<ViewName>("dashboard");
  const [focusId, setFocusId] = useState<string | undefined>(undefined);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const unreadCount = notifications.filter((n) => n.userId === currentUser.id && !n.read).length;
  const openFaultCount = faultReports.filter((f) => f.status === "Open").length;

  const navigate = (v: string, id?: string) => {
    setView(v as ViewName);
    setFocusId(id);
    setNavOpen(false);
  };

  const financeRoles: UserRole[] = ["Finance", "Manager", "Owner"];

  const NAV_ITEMS = [
    { id: "dashboard",     label: "Dashboard",      icon: <LayoutDashboard size={18} />, roles: [] as UserRole[] },
    { id: "machines",      label: "Machines",        icon: <Cpu size={18} />,             roles: [] as UserRole[] },
    { id: "workorders",    label: "Work Orders",     icon: <ClipboardList size={18} />,   roles: [] as UserRole[] },
    { id: "faults",        label: "Fault Reports",   icon: <Flag size={18} />,            roles: [] as UserRole[] },
    { id: "repairs",       label: "Repair Records",  icon: <Camera size={18} />,          roles: [] as UserRole[] },
    { id: "analytics",     label: "Analytics",       icon: <BarChart2 size={18} />,       roles: [] as UserRole[] },
    { id: "finance",       label: "Finance",          icon: <Receipt size={18} />,         roles: financeRoles },
    { id: "notifications", label: "Notifications",   icon: <Bell size={18} />,            roles: [] as UserRole[] },
  ];

  const visibleNav = NAV_ITEMS.filter((n) => n.roles.length === 0 || n.roles.includes(currentUser.role));

  const viewLabels: Record<ViewName, string> = {
    dashboard: "Dashboard", machines: "Machines", workorders: "Work Orders",
    faults: "Fault Reports", notifications: "Notifications",
    repairs: "Repair Records", analytics: "Analytics — 2024", finance: "Finance",
  };

  return (
    <div className="min-h-screen bg-background flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-primary flex flex-col transition-transform duration-200 ${navOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-accent flex items-center justify-center shrink-0"><Wrench size={16} className="text-white" /></div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">MachineTrack</p>
              <p className="text-white/50 text-xs font-mono">Maintenance System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {visibleNav.map((n) => {
            const active = view === n.id;
            const badge = n.id === "notifications" && unreadCount > 0 ? unreadCount
              : n.id === "faults" && openFaultCount > 0 ? openFaultCount : 0;
            return (
              <button key={n.id} onClick={() => navigate(n.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? "bg-white/15 text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}>
                {n.icon}
                {n.label}
                {badge > 0 && (
                  <span className={`ml-auto text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${n.id === "faults" ? "bg-red-500" : "bg-accent"}`}>{badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-colors text-left">
              <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center shrink-0"><User size={15} className="text-white" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{currentUser.name}</p>
                <p className="text-white/50 text-xs font-mono truncate">{currentUser.role}</p>
              </div>
              <ChevronDown size={14} className="text-white/50 shrink-0" />
            </button>
            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-card rounded-lg border border-border shadow-xl overflow-hidden z-50">
                <p className="text-xs font-mono text-muted-foreground px-3 pt-2 pb-1">Switch user (demo)</p>
                {USERS.map((u) => (
                  <button key={u.id} onClick={() => { setCurrentUser(u); setShowUserMenu(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors ${currentUser.id === u.id ? "text-primary font-semibold" : "text-foreground"}`}>
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

      {navOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setNavOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-card border-b border-border px-5 py-3.5 flex items-center gap-4">
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setNavOpen(true)}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" /></svg>
          </button>
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">{viewLabels[view]}</h1>
            <p className="text-xs text-muted-foreground font-mono">{currentUser.site} · {currentUser.role}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block font-mono">{currentUser.name}</span>
            <button onClick={() => navigate("notifications")} className="relative w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-secondary transition-colors">
              <Bell size={17} className="text-muted-foreground" />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-accent rounded-full text-white text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>}
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-6 overflow-auto">
          {view === "dashboard" && (
            <DashboardView machines={machines} workOrders={workOrders}
              repairRecords={repairRecords} faultReports={faultReports} onNavigate={navigate} />
          )}
          {view === "machines" && (
            <MachineRegistryView machines={machines} setMachines={setMachines} workOrders={workOrders}
              repairRecords={repairRecords} faultReports={faultReports} setFaultReports={setFaultReports}
              focusId={focusId} onNavigate={navigate} currentUser={currentUser} />
          )}
          {view === "workorders" && (
            <WorkOrdersView workOrders={workOrders} setWorkOrders={setWorkOrders} machines={machines}
              users={USERS} notifications={notifications} setNotifications={setNotifications}
              currentUser={currentUser} focusId={focusId} faultReports={faultReports} />
          )}
          {view === "faults" && (
            <FaultReportsView faultReports={faultReports} setFaultReports={setFaultReports}
              machines={machines} users={USERS} workOrders={workOrders} setWorkOrders={setWorkOrders}
              notifications={notifications} setNotifications={setNotifications}
              currentUser={currentUser} onNavigate={navigate} focusId={focusId} />
          )}
          {view === "repairs" && (
            <RepairRecordsView repairRecords={repairRecords} machines={machines} users={USERS} focusId={focusId} />
          )}
          {view === "analytics" && (
            <AnalyticsView repairRecords={repairRecords} machines={machines} />
          )}
          {view === "finance" && financeRoles.includes(currentUser.role) && (
            <FinanceView repairRecords={repairRecords} workOrders={workOrders} setWorkOrders={setWorkOrders}
              machines={machines} users={USERS} currentUser={currentUser} />
          )}
          {view === "finance" && !financeRoles.includes(currentUser.role) && (
            <Card className="flex flex-col items-center justify-center h-64 text-center">
              <Receipt size={36} className="text-muted-foreground/40 mb-3" />
              <p className="text-sm font-semibold text-foreground">Access Restricted</p>
              <p className="text-xs text-muted-foreground mt-1">Finance view is only available to Finance, Manager, and Owner roles.</p>
            </Card>
          )}
          {view === "notifications" && (
            <NotificationsView notifications={notifications} setNotifications={setNotifications}
              currentUser={currentUser} onNavigate={navigate} />
          )}
        </main>
      </div>
    </div>
  );
}
