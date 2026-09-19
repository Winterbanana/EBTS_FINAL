const API_URL = 'http://localhost/EBTS/api/index.php';

export interface AppState {
  users: unknown[];
  equipment: unknown[];
  requests: unknown[];
}

export async function loadAppState(): Promise<AppState | null> {
  const response = await fetch(API_URL, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Database load failed (${response.status})`);
  const payload = await response.json() as { data?: AppState; configured?: boolean };
  return payload.configured === false ? null : payload.data || null;
}

export async function saveAppState(state: AppState): Promise<void> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(state),
  });
  if (!response.ok) throw new Error(`Database save failed (${response.status})`);
}
