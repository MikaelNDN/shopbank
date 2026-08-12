import { useCallback, useEffect, useState } from 'react';

import {
  adminApi,
  type DashboardData,
  type DashboardPeriod,
} from '@/api/adminApi';

export function useDashboard(period: DashboardPeriod = '30d') {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await adminApi.getDashboard(period);
      setData(next);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, refetch };
}
