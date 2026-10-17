import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/features/transfers/constants/queryKeys';
import { getLedger, recoverPending } from '@/features/transfers/services/transferApi';

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
