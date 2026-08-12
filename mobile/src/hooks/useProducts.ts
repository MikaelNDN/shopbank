import { useCallback, useEffect, useState } from 'react';

import { productApi } from '@/api/productApi';
import type { Product, ProductFilters } from '@/types/product';

interface State {
  products: Product[];
  isLoading: boolean;
  error: string | null;
}

export function useProducts(filters: ProductFilters) {
  const [state, setState] = useState<State>({
    products: [],
    isLoading: true,
    error: null,
  });

  const fetchProducts = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setState((s) => ({ ...s, isLoading: true, error: null }));
      }
      try {
        const products = await productApi.list(filters);
        setState({ products, isLoading: false, error: null });
      } catch (error) {
        setState({
          products: [],
          isLoading: false,
          error:
            error instanceof Error ? error.message : 'Erro ao carregar produtos',
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(filters)],
  );

  useEffect(() => {
    fetchProducts(true);
  }, [fetchProducts]);

  return { ...state, refetch: () => fetchProducts(false) };
}
