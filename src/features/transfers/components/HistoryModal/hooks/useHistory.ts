import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/features/transfers/constants/queryKeys';
import { getLedger } from '@/features/transfers/services/transferApi';

export function useHistory() {
  return useInfiniteQuery({
    queryKey: queryKeys.history,
    queryFn: async ({ pageParam }) => (await getLedger()).history(pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page) => page.nextCursor,
  });
}
