import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import {
  contactPermission,
  loadContacts,
  manageLimitedContacts,
  requestContactPermission,
} from '@/features/contacts/services/deviceContacts';

const permissionKey = ['contacts-permission'] as const;
export function useContacts(search: string) {
  const client = useQueryClient();
  const [name, setName] = useState('');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void client.invalidateQueries({ queryKey: permissionKey });
        void client.invalidateQueries({ queryKey: ['contacts'] });
      }
    });
    return () => subscription.remove();
  }, [client]);
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
    enabled: permission.data?.granted === true,
    gcTime: 0,
    staleTime: 0,
    retry: false,
  });
  const access = useMutation({
    mutationFn: async (limited: boolean) => {
      if (limited) {
        await manageLimitedContacts();
        return contactPermission();
      }
      return requestContactPermission();
    },
    onSuccess: async (data) => {
      client.setQueryData(permissionKey, data);
      await client.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
  return { permission, contacts, access, searching: name !== search.trim() };
}
