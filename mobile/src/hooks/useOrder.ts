import { useCallback, useEffect, useState } from 'react';

import { orderApi } from '@/api/orderApi';
import { paymentApi } from '@/api/paymentApi';
import type { Order, Payment } from '@/types/order';

interface State {
  order: Order | null;
  payment: Payment | null;
  isLoading: boolean;
  error: string | null;
}

export function useOrder(id: string | undefined) {
  const [state, setState] = useState<State>({
    order: null,
    payment: null,
    isLoading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    if (!id) {
      setState({
        order: null,
        payment: null,
        isLoading: false,
        error: 'Pedido inválido',
      });
      return;
    }
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const order = await orderApi.getById(id);
      const payment = order
        ? await paymentApi.getByOrderId(order.id)
        : null;
      setState({
        order,
        payment,
        isLoading: false,
        error: order ? null : 'Pedido não encontrado',
      });
    } catch (error) {
      setState({
        order: null,
        payment: null,
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Erro ao carregar pedido',
      });
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}
