import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, Loading } from '@/components/common';
import { OrderCard } from '@/components/order/OrderCard';
import { STATUS_LABEL } from '@/components/order/StatusBadge';
import { useMyOrders } from '@/hooks/useMyOrders';
import type { OrderStatus } from '@/types/order';

type Filter = 'ALL' | OrderStatus;

const FILTERS: Filter[] = [
  'ALL',
  'PENDING_PAYMENT',
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'CANCELED',
];

const FILTER_LABEL: Record<Filter, string> = {
  ALL: 'Todos',
  PENDING_PAYMENT: STATUS_LABEL.PENDING_PAYMENT,
  PAID: STATUS_LABEL.PAID,
  SHIPPED: STATUS_LABEL.SHIPPED,
  DELIVERED: STATUS_LABEL.DELIVERED,
  CANCELED: STATUS_LABEL.CANCELED,
};

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, isLoading, refetch } = useMyOrders();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const filtered = useMemo(
    () => (filter === 'ALL' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) return <Loading message="Carregando pedidos..." />;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900">Meus pedidos</Text>
        <Text className="mt-1 text-sm text-muted">
          {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        className="max-h-[44px]"
      >
        {FILTERS.map((f) => {
          const selected = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={`self-start rounded-full border px-3.5 py-1.5 ${
                selected
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-border bg-white'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  selected ? 'text-white' : 'text-gray-700'
                }`}
              >
                {FILTER_LABEL[f]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {orders.length === 0 ? (
        <EmptyState
          icon="list-alt"
          title="Você ainda não tem pedidos"
          description="Suas compras aparecerão aqui."
          ctaLabel="Comprar agora"
          onCtaPress={() => router.push('/(client)/(tabs)/products')}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="filter"
          title="Nenhum pedido neste filtro"
          description="Tente outro status."
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 24,
            paddingTop: 12,
            gap: 12,
          }}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => router.push(`/(client)/order/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}
