import { waitForForeground } from '../../auth/services/foreground';
import { queryKeys } from '../constants/queryKeys';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { useEffect, useRef, useState } from 'react';
import { AppState, BackHandler } from 'react-native';
import { authorizeTransfer, AuthenticationError } from '../../auth/services/authorize';
import { getLedger, submitTransfer, type Simulation } from '../services/transferApi';
import { TransferError } from '../domain/errors';
import type { TransferAttempt } from '../services/ledger';
import type { Recipient, TransferDraft, TransferReceipt } from '../domain/types';

export function useTransfer() {
  const client = useQueryClient();
  const [phase, setPhase] = useState<'idle' | 'authorizing' | 'sending' | 'checking'>('idle');
  const [unresolved, setUnresolved] = useState(false);
  const locked = useRef(false);
  const attemptRef = useRef<TransferAttempt | null>(null);
  const lifecycle = useRef({ active: true });

  useEffect(() => {
    const scope = { active: true };
    lifecycle.current = scope;
    const back = BackHandler.addEventListener('hardwareBackPress', () => locked.current);
    return () => {
      scope.active = false;
      back.remove();
    };
  }, []);

  const mutation = useMutation<
    TransferReceipt,
    Error,
    { draft: TransferDraft; recipient: Recipient; simulation: Simulation }
  >({
    retry: false,
    mutationFn: async ({ draft, recipient, simulation }) => {
      const scope = lifecycle.current;
      const ledger = await getLedger();
      if (attemptRef.current) {
        if (scope.active) setPhase('checking');
        const receipt = await ledger.find(attemptRef.current.idempotencyKey);
        try {
          await ledger.clearPending(attemptRef.current.idempotencyKey);
        } catch {
          throw new TransferError(
            'uncertain',
            'We couldn’t save the transfer status. Please check again.',
          );
        }
        attemptRef.current = null;
        if (scope.active) setUnresolved(false);
        if (receipt) return receipt;
        throw new TransferError(
          'network',
          'No transfer was completed. You can safely authorize a new attempt.',
        );
      }
      if (scope.active) setPhase('authorizing');
      await authorizeTransfer(draft, recipient);
      if (!scope.active || !(await waitForForeground()) || !scope.active)
        throw new AuthenticationError(
          'cancelled',
          'Return to Aster and authorize the transfer again. No money was sent.',
        );
      const attempt = { idempotencyKey: Crypto.randomUUID(), draft: { ...draft } };
      await ledger.savePending(attempt);
      attemptRef.current = attempt;
      if (scope.active) setPhase('sending');
      try {
        if (!scope.active || AppState.currentState !== 'active')
          throw new AuthenticationError(
            'cancelled',
            'Authorization expired while leaving Aster. No money was sent.',
          );
        const receipt = await submitTransfer(attempt, simulation);
        await ledger.clearPending(attempt.idempotencyKey);
        attemptRef.current = null;
        return receipt;
      } catch (error) {
        if (
          error instanceof AuthenticationError ||
          (error instanceof TransferError && error.kind !== 'uncertain')
        ) {
          try {
            await ledger.clearPending(attempt.idempotencyKey);
          } catch {
            if (scope.active) setUnresolved(true);
            throw new TransferError(
              'uncertain',
              'We couldn’t save the transfer status. Check the transfer status before trying again.',
            );
          }
          attemptRef.current = null;
          throw error;
        }
        if (scope.active) setUnresolved(true);
        throw new TransferError(
          'uncertain',
          'We couldn’t confirm the result. Check the transfer status before trying again.',
        );
      }
    },
    onSettled: async () => {
      locked.current = false;
      if (lifecycle.current.active) setPhase('idle');
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.account }),
        client.invalidateQueries({ queryKey: queryKeys.history }),
      ]);
    },
  });

  function send(draft: TransferDraft, recipient: Recipient, simulation: Simulation) {
    if (locked.current) return;
    locked.current = true;
    mutation.mutate({ draft: { ...draft }, recipient, simulation });
  }
  return {
    send,
    phase,
    unresolved,
    busy: phase !== 'idle' || mutation.isPending,
    error: mutation.error,
    receipt: mutation.data,
    reset: mutation.reset,
  };
}
