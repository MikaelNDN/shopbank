import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { adminApi, type CustomerSummary } from '@/api/adminApi';
import { orderApi } from '@/api/orderApi';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminOrderRow } from '@/components/admin/AdminOrderRow';
import { EmptyState, Loading, SearchBar } from '@/components/common';
import { STATUS_LABEL } from '@/components/order/StatusBadge';
import { useDebounce } from '@/hooks/useDebounce';
import type { Order, OrderStatus } from '@/types/order';

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

export default function AdminOrdersListScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');

  const debounced = useDebounce(search, 300);

  const fetch = useCallback(async () => {
    const [ordersList, customersList] = await Promise.all([
      orderApi.listAll({
        search: debounced,
        status: filter === 'ALL' ? undefined : filter,
      }),
      adminApi.listCustomers(),
    ]);
    setOrders(ordersList);
    setCustomers(customersList);
    setLoading(false);
  }, [debounced, filter]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetch();
    }, [fetch]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetch();
    setRefreshing(false);
  }, [fetch]);

  if (loading) return <Loading message="Carregando pedidos..." />;

  const customerName = (id: string) =>
    customers.find((c) => c.user.id === id)?.user.name ?? 'Cliente';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AdminHeader
        title="Pedidos"
        subtitle={`${orders.length} pedidos`}
      />

      <View className="px-6 pb-3">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por id, cliente ou produto..."
        />
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
          icon="shopping-bag"
          title="Nenhum pedido"
          description="Ajuste os filtros ou aguarde novos pedidos."
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingVertical: 12,
            paddingBottom: 32,
            gap: 10,
          }}
          renderItem={({ item }) => (
            <AdminOrderRow
              order={item}
              customerName={customerName(item.customerId)}
              onPress={() => router.push(`/(admin)/orders/${item.id}`)}
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
