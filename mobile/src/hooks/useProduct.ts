import { useCallback, useEffect, useState } from 'react';

import { productApi } from '@/api/productApi';
import type { Product } from '@/types/product';

interface State {
  product: Product | null;
  related: Product[];
  isLoading: boolean;
  error: string | null;
}

export function useProduct(id: string | undefined) {
  const [state, setState] = useState<State>({
    product: null,
    related: [],
    isLoading: true,
    error: null,
  });

  const fetchProduct = useCallback(async () => {
    if (!id) {
      setState({
        product: null,
        related: [],
        isLoading: false,
        error: 'Produto inválido',
      });
      return;
    }
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const [product, related] = await Promise.all([
        productApi.getById(id),
        productApi.related(id),
      ]);
      setState({
        product,
        related,
        isLoading: false,
        error: product ? null : 'Produto não encontrado',
      });
    } catch (error) {
      setState({
        product: null,
        related: [],
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Erro ao carregar produto',
      });
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { ...state, refetch: fetchProduct };
}
