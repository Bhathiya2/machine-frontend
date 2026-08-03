import type {
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  WorkOrderApi,
} from "@/interfaces/all/workOrder";
import type {
  CostEntry,
  WorkOrder,
  WorkOrderStatus,
} from "@/pages/dashboard/types";

export type WorkOrderFormData = {
  machineId: string;
  title: string;
  description: string;
  assignedTo: string;
  priority: "Low" | "Medium" | "High";
  status: WorkOrderStatus;
  notes: string;
  faultReportId?: string;
};

function formatDate(value: string): string {
  return value.includes("T") ? value.split("T")[0] : value;
}

function mapCostEntries(entries: WorkOrderApi["cost_entries"]): CostEntry[] {
  if (!entries?.length) return [];
  return entries.map((entry) => ({
    id: entry.id,
    category: entry.category as CostEntry["category"],
    amount: entry.amount,
    quantity: entry.quantity,
    unitPrice: entry.unitPrice,
    details: entry.details,
    date: entry.date,
  }));
}

export function apiWorkOrderToUi(api: WorkOrderApi): WorkOrder {
  return {
    dbId: Number(api.id),
    id: api.work_order_number,
    machineId: api.machine?.machine_number ?? "",
    title: api.title,
    description: api.description ?? "",
    assignedTo: api.assigned_to,
    createdBy: api.created_by,
    status: api.status as WorkOrderStatus,
    createdAt: formatDate(api.created_at),
    updatedAt: formatDate(api.updated_at),
    priority: api.priority as WorkOrder["priority"],
    notes: api.notes ?? "",
    technician_notes:
      api.technician_notes?.map((note) => ({
        ...note,
        created_at: formatDate(note.created_at),
      })) ?? [],
    activities:
      api.activities?.map((activity) => ({
        ...activity,
        created_at: formatDate(activity.created_at),
      })) ?? [],
    faultReportId: api.fault_report_id ?? undefined,
    costEntries: mapCostEntries(api.cost_entries),
    active_technician_id: api.active_technician_id ?? undefined,
    checked_in_at: api.checked_in_at ?? undefined,
  };
}

export function formToCreateDto(
  form: WorkOrderFormData,
  createdBy: string,
): CreateWorkOrderDto {
  return {
    machine_number: form.machineId,
    title: form.title.trim(),
    description: form.description.trim(),
    assigned_to: form.assignedTo,
    created_by: createdBy,
    status: form.status,
    priority: form.priority,
    notes: form.notes.trim() || undefined,
    fault_report_id: form.faultReportId,
    cost_entries: [],
  };
}

export function formToUpdateDto(form: WorkOrderFormData): UpdateWorkOrderDto {
  return {
    machine_number: form.machineId,
    title: form.title.trim(),
    description: form.description.trim(),
    assigned_to: form.assignedTo,
    status: form.status,
    priority: form.priority,
    notes: form.notes.trim() || undefined,
    fault_report_id: form.faultReportId,
  };
}

export function statusPatchDto(status: WorkOrderStatus): UpdateWorkOrderDto {
  return { status };
}

export function notesPatchDto(notes: string): UpdateWorkOrderDto {
  return { notes };
}

export function costEntriesPatchDto(entries: CostEntry[]): UpdateWorkOrderDto {
  return {
    cost_entries: entries.map((entry) => ({
      id: entry.id,
      category: entry.category,
      amount: entry.amount,
      quantity: entry.quantity,
      unitPrice: entry.unitPrice,
      details: entry.details,
      date: entry.date,
    })),
  };
}
