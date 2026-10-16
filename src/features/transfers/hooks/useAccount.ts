import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import { getLedger, recoverPending } from '../services/transferApi';

export function useAccount() {
  const account = useQuery({
    queryKey: queryKeys.account,
    queryFn: async () => (await getLedger()).account(),
  });
  const recovery = useQuery({
    queryKey: queryKeys.recovery,
    queryFn: recoverPending,
    staleTime: Infinity,
  });
  return { account, recovery };
}
