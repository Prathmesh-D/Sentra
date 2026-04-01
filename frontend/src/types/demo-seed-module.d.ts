declare module '@/data/demoSeedData' {
  export const demoUser: any;
  export const demoInboxMessages: any[];
  export const demoOutboxMessages: any[];
  export const demoContacts: any[];
  export const demoInboxApiFiles: any[];
  export const demoOutboxApiFiles: any[];
  export function buildDemoDashboardData(): any;
  export function createInitialDemoSession(): any;
}
