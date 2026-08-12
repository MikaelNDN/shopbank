import { useCallback, useEffect, useState } from 'react';

import { orderApi } from '@/api/orderApi';
import { useAuth } from '@/hooks/useAuth';
import type { Order } from '@/types/order';

export function useMyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const list = await orderApi.getMyOrders(user.id);
      setOrders(list);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { orders, isLoading, refetch };
}
