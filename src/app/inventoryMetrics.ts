import { BorrowRequest, Equipment } from './types';

export interface EquipmentInventoryMetric {
  total: number;
  borrowed: number;
  available: number;
  missing: number;
  unavailable: number;
}

export interface InventoryMetrics extends EquipmentInventoryMetric {
  byEquipmentId: Map<string, EquipmentInventoryMetric>;
}

export function getInventoryMetrics(equipment: Equipment[], requests: BorrowRequest[]): InventoryMetrics {
  const activeRequests = new Map<string, Set<string>>();
  for (const request of requests) {
    if (request.status !== 'Approved') continue;
    const requestIds = activeRequests.get(request.equipmentId) || new Set<string>();
    requestIds.add(request.id);
    activeRequests.set(request.equipmentId, requestIds);
  }

  const byEquipmentId = new Map<string, EquipmentInventoryMetric>();
  const totals: EquipmentInventoryMetric = { total: 0, borrowed: 0, available: 0, missing: 0, unavailable: 0 };

  for (const item of equipment) {
    const total = Math.max(0, item.totalStock || 0);
    const borrowed = Math.min(total, activeRequests.get(item.id)?.size || 0);
    const unavailable = item.status === 'Unavailable' ? Math.max(0, total - borrowed) : 0;
    const missing = item.status === 'Missing' ? Math.max(0, total - borrowed) : 0;
    const available = Math.max(0, total - borrowed - unavailable - missing);
    const metric = { total, borrowed, available, missing, unavailable };
    byEquipmentId.set(item.id, metric);
    totals.total += total;
    totals.borrowed += borrowed;
    totals.available += available;
    totals.missing += missing;
    totals.unavailable += unavailable;
  }

  return { ...totals, byEquipmentId };
}