export type Simulation = 'normal' | 'offline' | 'insufficient' | 'response-lost';
export const simulationOptions: readonly {
  value: Simulation;
  title: string;
  description: string;
}[] = [
  {
    value: 'normal',
    title: 'Successful transfer',
    description: 'Normal processing after device authorization.',
  },
  {
    value: 'offline',
    title: 'Network unavailable',
    description: 'Reject before debit; retry requires new authorization.',
  },
  {
    value: 'insufficient',
    title: 'Bank rejects funds',
    description: 'The simulated bank declines the transfer without debiting.',
  },
  {
    value: 'response-lost',
    title: 'Response lost after sending',
    description: 'Complete once, then resolve its status without a second payment.',
  },
];
