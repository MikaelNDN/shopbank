import FontAwesome from '@expo/vector-icons/FontAwesome';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { adminApi, type CustomerDetail } from '@/api/adminApi';
import { AdminOrderRow } from '@/components/admin/AdminOrderRow';
import { KpiCard } from '@/components/admin/KpiCard';
import { EmptyState, Loading } from '@/components/common';
import { formatCurrency } from '@/utils/formatCurrency';

export default function AdminCustomerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    adminApi.getCustomer(id).then((data) => {
      setCustomer(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <Loading message="Carregando cliente..." />;

  if (!customer) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <EmptyState
          icon="user-times"
          title="Cliente não encontrado"
          ctaLabel="Voltar"
          onCtaPress={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const initials = customer.user.name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center px-6 py-4">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <FontAwesome name="angle-left" size={24} color="#111827" />
        </Pressable>
        <Text className="ml-3 text-xl font-bold text-gray-900">
          Detalhe do cliente
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="items-center px-6 pb-6 pt-2">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-primary-50">
            <Text className="text-2xl font-bold text-primary-700">
              {initials || '?'}
            </Text>
          </View>
          <Text className="mt-3 text-xl font-bold text-gray-900">
            {customer.user.name}
          </Text>
          <Text className="text-sm text-muted">{customer.user.email}</Text>
          {customer.user.cpf ? (
            <Text className="mt-1 text-xs text-muted">
              CPF: {customer.user.cpf}
            </Text>
          ) : null}
          <Text className="mt-1 text-xs text-muted">
            Cadastrado em{' '}
            {customer.user.createdAt
              ? format(new Date(customer.user.createdAt), 'd MMM yyyy', {
                  locale: ptBR,
                })
              : '—'}
          </Text>
        </View>

        <View className="px-6">
          <Text className="mb-3 text-sm font-bold uppercase text-muted">
            Resumo
          </Text>
          <View className="gap-3">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <KpiCard
                  label="Pedidos"
                  value={String(customer.totalOrders)}
                  icon="shopping-bag"
                />
              </View>
              <View className="flex-1">
                <KpiCard
                  label="Total gasto"
                  value={formatCurrency(customer.totalSpent)}
                  icon="dollar"
                  tone="primary"
                />
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <KpiCard
                  label="Ticket médio"
                  value={formatCurrency(customer.averageTicket)}
                  icon="credit-card"
                />
              </View>
              <View className="flex-1">
                <KpiCard
                  label="Último pedido"
                  value={
                    customer.lastOrderAt
                      ? format(new Date(customer.lastOrderAt), 'd MMM', {
                          locale: ptBR,
                        })
                      : '—'
                  }
                  icon="calendar"
                />
              </View>
            </View>
          </View>
        </View>

        <View className="px-6 pt-6">
          <Text className="mb-3 text-sm font-bold uppercase text-muted">
            Pedidos ({customer.orders.length})
          </Text>
          {customer.orders.length === 0 ? (
            <Text className="text-sm text-muted">
              Esse cliente ainda não fez pedidos.
            </Text>
          ) : (
            <View className="gap-3">
              {customer.orders.map((order) => (
                <AdminOrderRow
                  key={order.id}
                  order={order}
                  customerName={customer.user.name}
                  onPress={() =>
                    router.push(`/(admin)/orders/${order.id}`)
                  }
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
