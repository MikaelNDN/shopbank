import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { orderApi } from '@/api/orderApi';
import { Button, EmptyState, Loading } from '@/components/common';
import { OrderSummary } from '@/components/order/OrderSummary';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { StatusBadge } from '@/components/order/StatusBadge';
import { useOrder } from '@/hooks/useOrder';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatZipCode } from '@/utils/formatZipCode';

const PAYMENT_LABEL: Record<string, string> = {
  ABACATEPAY: 'AbacatePay',
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de débito',
  BOLETO: 'Boleto',
};

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { order, payment, isLoading, error, refetch } = useOrder(id);

  if (isLoading) return <Loading message="Carregando pedido..." />;

  if (error || !order) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <EmptyState
          icon="exclamation-triangle"
          title="Pedido não encontrado"
          description={error ?? undefined}
          ctaLabel="Voltar"
          onCtaPress={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const canCancel =
    order.status === 'PENDING_PAYMENT' || order.status === 'PAID';
  const canPay = order.status === 'PENDING_PAYMENT' && payment;
  const displayedPaymentMethod = payment?.method ?? order.paymentMethod;

  const handleCancel = () => {
    Alert.alert(
      'Cancelar pedido',
      order.status === 'PAID'
        ? 'Cancelar este pedido vai estornar o pagamento e devolver os itens ao estoque.'
        : 'Deseja cancelar este pedido?',
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar pedido',
          style: 'destructive',
          onPress: async () => {
            try {
              await orderApi.cancel(order.id);
              Toast.show({ type: 'info', text1: 'Pedido cancelado' });
              refetch();
            } catch (e) {
              Alert.alert(
                'Erro',
                e instanceof Error ? e.message : 'Falhou ao cancelar',
              );
            }
          },
        },
      ],
    );
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
          <Text className="text-xl font-bold text-gray-900">
            Pedido
          </Text>
        </View>
        <StatusBadge status={order.status} size="md" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View className="px-6 pt-2">
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

        <Section title="Endereço de entrega">
          <View className="rounded-xl border border-border bg-white p-4">
            <View className="flex-row items-center gap-2">
              <FontAwesome name="map-marker" size={14} color="#ed751e" />
              <Text className="text-sm font-semibold text-gray-900">
                {order.shippingAddress.label}
              </Text>
            </View>
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
                {PAYMENT_LABEL[displayedPaymentMethod] ?? displayedPaymentMethod}
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
                  {payment.status === 'APPROVED'
                    ? 'Aprovado'
                    : payment.status === 'REJECTED'
                      ? 'Rejeitado'
                      : payment.status === 'REFUNDED'
                        ? 'Estornado'
                        : 'Pendente'}
                </Text>
              ) : null}
            </View>
            {payment ? (
              <Text className="mt-1 text-xs text-muted">ID: {payment.id}</Text>
            ) : null}
            <Text className="mt-2 text-xs text-muted">
              Criado em{' '}
              {format(new Date(order.createdAt), "d 'de' MMM 'de' yyyy, HH:mm", {
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
        {canPay ? (
          <Button
            label="Pagar agora"
            size="lg"
            fullWidth
            onPress={() => router.push(`/(client)/payment/${order.id}`)}
          />
        ) : null}
        {canCancel ? (
          <View className={canPay ? 'mt-2' : ''}>
            <Button
              label="Cancelar pedido"
              variant="outline"
              fullWidth
              onPress={handleCancel}
            />
          </View>
        ) : null}
        {!canPay && !canCancel ? (
          <Button
            label="Voltar para meus pedidos"
            variant="outline"
            fullWidth
            onPress={() => router.replace('/(client)/(tabs)/orders')}
          />
        ) : null}
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
