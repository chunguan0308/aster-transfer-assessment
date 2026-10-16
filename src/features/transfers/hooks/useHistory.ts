import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '../constants/queryKeys';
import { getLedger } from '../services/transferApi';

export function useHistory() {
  return useInfiniteQuery({
    queryKey: queryKeys.history,
    queryFn: async ({ pageParam }) => (await getLedger()).history(pageParam),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (page) => page.nextCursor,
  });
}
