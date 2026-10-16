import * as Crypto from 'expo-crypto';
import * as Network from 'expo-network';
import { openDatabaseAsync } from 'expo-sqlite';
import { TransferError } from '../domain/errors';
import { createLedger, type Ledger, type TransferAttempt } from './ledger';

export type Simulation = 'normal' | 'offline' | 'insufficient' | 'response-lost';
let opening: Promise<Ledger> | undefined;
export function getLedger(): Promise<Ledger> {
  if (!opening) {
    opening = (async () => {
      const db = await openDatabaseAsync('aster-ledger.db');
      const ledger = createLedger(db);
      try {
        await ledger.initialize();
        return ledger;
      } catch (error) {
        await db.closeAsync();
        throw error;
      }
    })().catch((error: unknown) => {
      opening = undefined;
      throw error;
    });
  }
  return opening;
}

export async function submitTransfer(attempt: TransferAttempt, simulation: Simulation) {
  const ledger = await getLedger();
  // The mock simulates transport, not bank authorization. A real API verifies a signed challenge.
  const network = await Network.getNetworkStateAsync();
  await new Promise((resolve) => setTimeout(resolve, 1000));
  if (
    simulation === 'offline' ||
    network.isConnected === false ||
    network.isInternetReachable === false
  )
    throw new TransferError(
      'network',
      'You’re offline. No money was sent. Check your connection and try again.',
    );
  if (simulation === 'insufficient')
    throw new TransferError(
      'funds',
      'The simulated bank rejected this transfer because funds are unavailable. Edit the details or try again.',
    );
  try {
    const receipt = await ledger.complete(
      attempt,
      `AST-${Crypto.randomUUID().toUpperCase()}`,
      new Date().toISOString(),
    );
    if (simulation === 'response-lost') throw new Error('Simulated response loss');
    return receipt;
  } catch (error) {
    if (error instanceof TransferError) throw error;
    throw new TransferError(
      'uncertain',
      'We couldn’t confirm the result. Check the transfer status before trying again.',
    );
  }
}

export async function recoverPending() {
  const ledger = await getLedger();
  const pending = await ledger.pending();
  if (!pending) return null;
  const receipt = await ledger.find(pending.idempotencyKey);
  // Local mock work cannot continue after process death. A real remote API must resolve its status.
  await ledger.clearPending(pending.idempotencyKey);
  return receipt;
}
