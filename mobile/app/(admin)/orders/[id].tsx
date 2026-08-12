import FontAwesome from '@expo/vector-icons/FontAwesome';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { adminApi, type CustomerDetail } from '@/api/adminApi';
import { orderApi } from '@/api/orderApi';
import { paymentApi } from '@/api/paymentApi';
import { OrderStatusActions } from '@/components/admin/OrderStatusActions';
import { EmptyState, Loading } from '@/components/common';
import { OrderSummary } from '@/components/order/OrderSummary';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { StatusBadge } from '@/components/order/StatusBadge';
import type { Order, OrderStatus, Payment } from '@/types/order';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatZipCode } from '@/utils/formatZipCode';

const PAYMENT_LABEL: Record<string, string> = {
  ABACATEPAY: 'AbacatePay',
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de débito',
  BOLETO: 'Boleto',
};

export default function AdminOrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const ord = await orderApi.getById(id);
    setOrder(ord);
    if (ord) {
      const [pay, cust] = await Promise.all([
        paymentApi.getByOrderId(ord.id),
        adminApi.getCustomer(ord.customerId),
      ]);
      setPayment(pay);
      setCustomer(cust);
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetch();
    }, [fetch]),
  );

  if (loading) return <Loading message="Carregando pedido..." />;

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <EmptyState
          icon="exclamation-triangle"
          title="Pedido não encontrado"
          ctaLabel="Voltar"
          onCtaPress={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const handleTransition = async (next: OrderStatus) => {
    try {
      await orderApi.transitionStatus(order.id, next);
      Toast.show({ type: 'success', text1: 'Status atualizado' });
      fetch();
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Falha na transição',
        text2: e instanceof Error ? e.message : undefined,
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center px-6 py-4">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <FontAwesome name="angle-left" size={24} color="#111827" />
        </Pressable>
        <View className="ml-3 flex-1">
          <Text className="text-xs text-muted">
            #{order.id.slice(-8).toUpperCase()}
          </Text>
          <Text className="text-xl font-bold text-gray-900">Pedido</Text>
        </View>
        <StatusBadge status={order.status} size="md" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 220 }}>
        <View className="px-6 pt-2">
          <Text className="mb-3 text-sm font-bold uppercase text-muted">
            Cliente
          </Text>
          <View className="rounded-xl border border-border bg-white p-4">
            <Text className="text-sm font-semibold text-gray-900">
              {customer?.user.name ?? 'Cliente'}
            </Text>
            <Text className="text-xs text-muted">
              {customer?.user.email}
            </Text>
            {customer ? (
              <Text className="mt-2 text-xs text-muted">
                {customer.totalOrders}{' '}
                {customer.totalOrders === 1 ? 'pedido total' : 'pedidos totais'}
                {' · '}
                {formatCurrency(customer.totalSpent)} gastos
              </Text>
            ) : null}
          </View>
        </View>

        <View className="px-6 pt-6">
          <Text className="mb-3 text-sm font-bold uppercase text-muted">
            Acompanhamento
          </Text>
          <OrderTimeline status={order.status} />
        </View>

        <Section title={`Itens (${order.items.length})`}>
          <View className="gap-3">
            {order.items.map((item) => (
              <View
                key={item.productId}
                className="flex-row gap-3 rounded-xl border border-border bg-white p-3"
              >
                <View className="h-14 w-14 overflow-hidden rounded-lg bg-surface">
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                </View>
                <View className="flex-1 justify-center">
                  <Text
                    className="text-sm font-medium text-gray-900"
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  <Text className="mt-1 text-xs text-muted">
                    {item.quantity}x · {formatCurrency(item.price)}
                  </Text>
                </View>
                <Text className="self-center text-sm font-bold text-primary-600">
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Endereço">
          <View className="rounded-xl border border-border bg-white p-4">
            <Text className="text-sm font-semibold text-gray-900">
              {order.shippingAddress.label}
            </Text>
            <Text className="mt-2 text-sm text-gray-700">
              {order.shippingAddress.street}, {order.shippingAddress.number}
              {order.shippingAddress.complement
                ? ` - ${order.shippingAddress.complement}`
                : ''}
            </Text>
            <Text className="text-xs text-muted">
              {order.shippingAddress.neighborhood} ·{' '}
              {order.shippingAddress.city}/{order.shippingAddress.state} · CEP{' '}
              {formatZipCode(order.shippingAddress.zipCode)}
            </Text>
          </View>
        </Section>

        <Section title="Pagamento">
          <View className="rounded-xl border border-border bg-white p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-gray-900">
                {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}
              </Text>
              {payment ? (
                <Text
                  className={`text-xs font-semibold ${
                    payment.status === 'APPROVED'
                      ? 'text-success'
                      : payment.status === 'REJECTED'
                        ? 'text-danger'
                        : 'text-muted'
                  }`}
                >
                  {payment.status}
                </Text>
              ) : null}
            </View>
            {payment ? (
              <Text className="mt-1 text-xs text-muted">ID: {payment.id}</Text>
            ) : null}
            <Text className="mt-2 text-xs text-muted">
              Criado em{' '}
              {format(new Date(order.createdAt), "d MMM yyyy, HH:mm", {
                locale: ptBR,
              })}
            </Text>
            <Text className="text-xs text-muted">
              Atualizado em{' '}
              {format(new Date(order.updatedAt), "d MMM yyyy, HH:mm", {
                locale: ptBR,
              })}
            </Text>
          </View>
        </Section>

        <Section title="Resumo">
          <OrderSummary
            subtotal={order.subtotal}
            shipping={order.shipping}
            itemCount={order.items.length}
          />
        </Section>
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0 border-t border-border bg-white px-6 py-4 pb-6">
        <OrderStatusActions
          current={order.status}
          onTransition={handleTransition}
        />
      </View>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="px-6 pt-6">
      <Text className="mb-3 text-sm font-bold uppercase text-muted">
        {title}
      </Text>
      {children}
    </View>
  );
}
