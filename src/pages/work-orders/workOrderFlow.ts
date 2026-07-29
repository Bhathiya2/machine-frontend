import { WO_FLOW } from "@/pages/dashboard/constants";
import type { WorkOrderStatus } from "@/pages/dashboard/types";

export function isWoFinal(status: WorkOrderStatus) {
  return status === "Verified" || status === "Finished";
}

export function woFlowIndex(status: WorkOrderStatus) {
  if (status === "Close") return -1;
  return WO_FLOW.indexOf(status);
}

export function woNextStatus(current: WorkOrderStatus): WorkOrderStatus | null {
  const idx = woFlowIndex(current);
  if (idx < 0 || idx >= WO_FLOW.length - 1) return null;
  return WO_FLOW[idx + 1];
}

export function getNextWorkOrderActionStatus(
  current: WorkOrderStatus,
  userRole?: string,
): WorkOrderStatus | null {
  if (userRole === 'Super Admin' && current === 'Close') {
    return 'New';
  }

  if (userRole === "Technician") {
    return current === "New" ? "Inprogress" : null;
  }

  return woNextStatus(current);
}

export function woFlowLabel(status: WorkOrderStatus) {
  switch (status) {
    case "New":
      return "New";
    case "Inprogress":
      return "In Progress";
    case "Close":
      return "Closed";
    case "Verified":
      return "Verified";
    case "Finished":
      return "Finished";
  }
}

export function woActionLabel(target: WorkOrderStatus) {
  switch (target) {
    case "Inprogress":
      return "Start Work";
    case "Close":
      return "Close Work";
    case "Verified":
      return "Mark as Verified";
    case "Finished":
      return "Mark as Finished";
    case "New":
      return "Re-Open";
    default:
      return target;
  }
}

export function canTransitionTo(
  current: WorkOrderStatus,
  target: WorkOrderStatus,
) {
  if (current === "Close" && target === "Inprogress") return true;
  if (target === "Close" && current === "Inprogress") return true;
  if (current === "New" && target === "Inprogress") return true;
  return false;
}
