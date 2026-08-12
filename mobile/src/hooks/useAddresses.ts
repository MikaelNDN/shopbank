import { useCallback, useEffect, useState } from 'react';

import { addressApi } from '@/api/addressApi';
import { useAuth } from '@/hooks/useAuth';
import type { Address } from '@/types/address';

export function useAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const list = await addressApi.list(user.id);
      setAddresses(list);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const favorite = addresses.find((a) => a.isFavorite) ?? null;

  return { addresses, favorite, isLoading, refetch };
}
