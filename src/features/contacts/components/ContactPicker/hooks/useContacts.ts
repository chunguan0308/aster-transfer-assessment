import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import {
  contactPermission,
  loadContacts,
  requestContactPermission,
} from '@/features/contacts/services/deviceContacts';

const permissionKey = ['contacts-permission'] as const;
export function useContacts(search: string) {
  const client = useQueryClient();
  const [name, setName] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setName(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const permission = useQuery({
    queryKey: permissionKey,
    queryFn: contactPermission,
    gcTime: 0,
    staleTime: 0,
    retry: false,
  });
  const contacts = useInfiniteQuery({
    queryKey: ['contacts', name],
    queryFn: ({ pageParam }) => loadContacts(name, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextOffset,
    enabled: permission.isSuccess && permission.data.granted,
    gcTime: 0,
    staleTime: 0,
    retry: false,
  });
  const { refetch: refreshPermission } = permission;
  const refresh = useCallback(async () => {
    const result = await refreshPermission();
    if (result.isSuccess && result.data.granted)
      await client.invalidateQueries({ queryKey: ['contacts'] });
  }, [client, refreshPermission]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);
  const access = useMutation({
    mutationFn: requestContactPermission,
    onSuccess: async (data) => {
      client.setQueryData(permissionKey, data);
      await client.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
  return { permission, contacts, access, refresh, searching: name !== search.trim() };
}
