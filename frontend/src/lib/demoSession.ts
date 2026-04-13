import { createInitialDemoSession } from '@/data/demoSeedData';

export const DEMO_SESSION_KEY = 'demo_session';

export interface DemoSession {
  isDemo: true;
  user: any;
  inboxFiles: any[];
  outboxFiles: any[];
  contacts: any[];
  dashboard: any;
  createdAt: string;
}

export function getDemoSession(): DemoSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(DEMO_SESSION_KEY);
    // Remove stale legacy demo state so app/web do not auto-enter demo mode on cold start.
    window.localStorage.removeItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.isDemo) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setDemoSession(session: DemoSession): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
  window.localStorage.removeItem(DEMO_SESSION_KEY);
}

export function updateDemoSession(updater: (current: DemoSession) => DemoSession): DemoSession | null {
  const current = getDemoSession();
  if (!current) return null;
  const next = updater(current);
  setDemoSession(next);
  return next;
}

export function clearDemoSessionStorage(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(DEMO_SESSION_KEY);
  window.localStorage.removeItem(DEMO_SESSION_KEY);
}

export function createAndStoreDemoSession(): DemoSession {
  const session = createInitialDemoSession() as DemoSession;
  setDemoSession(session);
  return session;
}

export function isDemoSessionActive(): boolean {
  return !!getDemoSession();
}
