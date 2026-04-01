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
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
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
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
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
  localStorage.removeItem(DEMO_SESSION_KEY);
}

export function createAndStoreDemoSession(): DemoSession {
  const session = createInitialDemoSession() as DemoSession;
  setDemoSession(session);
  return session;
}

export function isDemoSessionActive(): boolean {
  return !!getDemoSession();
}
