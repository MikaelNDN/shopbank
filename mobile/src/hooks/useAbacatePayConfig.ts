import { useEffect, useState } from 'react';

import { paymentConfigApi, type PaymentConfig } from '@/api/http/paymentConfigApi';

let cached: PaymentConfig | null = null;

export function useAbacatePayConfig() {
  const [config, setConfig] = useState<PaymentConfig | null>(cached);
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cached) return;
    let mounted = true;
    paymentConfigApi
      .get()
      .then((data) => {
        if (!mounted) return;
        cached = data;
        setConfig(data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Falha ao carregar config');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { config, isLoading, error };
}
