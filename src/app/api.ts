const API_URL = 'http://localhost/EBTS/api/index.php';

export interface AppState {
  users: unknown[];
  equipment: unknown[];
  requests: unknown[];
  equipmentAuditLogs?: unknown[];
  inventoryVersion?: number;
  revision?: number;
}

let pendingSave: Promise<void> = Promise.resolve();
let serverRevision = 0;

export async function loadAppState(): Promise<AppState | null> {
  const response = await fetch(API_URL, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Database load failed (${response.status})`);
  const payload = await response.json() as { data?: AppState; configured?: boolean; revision?: number };
  serverRevision = payload.revision ?? payload.data?.revision ?? 0;
  if (payload.configured === false || !payload.data) return null;
  return { ...payload.data, revision: serverRevision };
}

export async function saveAppState(state: AppState): Promise<number> {
  let savedRevision = serverRevision;
  const save = pendingSave.then(async () => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...state, revision: serverRevision }),
    });
    const payload = await response.json().catch(() => null) as { error?: string; revision?: number } | null;
    if (!response.ok) {
      throw new Error(payload?.error || `Database save failed (${response.status})`);
    }
    serverRevision = payload?.revision ?? serverRevision + 1;
    savedRevision = serverRevision;
  });
  pendingSave = save.catch(() => undefined);
  await save;
  return savedRevision;
}
