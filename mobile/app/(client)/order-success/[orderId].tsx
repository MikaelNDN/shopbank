import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { orderApi } from '@/api/orderApi';
import { Button, Loading } from '@/components/common';
import type { Order } from '@/types/order';
import { formatCurrency } from '@/utils/formatCurrency';

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!orderId) return;
    orderApi.getById(orderId).then((data) => {
      setOrder(data);
      setLoading(false);
    });
  }, [orderId]);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.1, { damping: 6 }),
      withSpring(1, { damping: 8 }),
    );
    opacity.value = withTiming(1, { duration: 400 });
  }, [scale, opacity]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const animatedIcon = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (loading) return <Loading message="Carregando..." />;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        <Animated.View
          style={animatedIcon}
          className="h-28 w-28 items-center justify-center rounded-full bg-success/10"
        >
          <FontAwesome name="check" size={48} color="#16a34a" />
        </Animated.View>

        <Text className="mt-8 text-center text-3xl font-bold text-gray-900">
          Pedido confirmado!
        </Text>
        {order ? (
          <Text className="mt-2 text-center text-base text-muted">
            #{order.id.slice(-8).toUpperCase()} ·{' '}
            {formatCurrency(order.total)}
          </Text>
        ) : null}
        <Text className="mt-4 text-center text-sm text-gray-700">
          Você receberá atualizações sobre o status do envio.
        </Text>

        {order ? (
          <View className="mt-8 w-full rounded-xl border border-border bg-surface p-4">
            <Text className="text-xs font-semibold uppercase text-muted">
              Endereço de entrega
            </Text>
            <Text className="mt-1 text-sm text-gray-900">
              {order.shippingAddress.street}, {order.shippingAddress.number}
            </Text>
            <Text className="text-xs text-muted">
              {order.shippingAddress.neighborhood} ·{' '}
              {order.shippingAddress.city}/{order.shippingAddress.state}
            </Text>
            <Text className="mt-3 text-xs text-muted">
              Prazo estimado: 5 a 10 dias úteis
            </Text>
          </View>
        ) : null}
      </View>

      <View className="px-6 pb-6 pt-2">
        <Button
          label="Ver detalhes do pedido"
          size="lg"
          fullWidth
          onPress={() =>
            order && router.replace(`/(client)/order/${order.id}`)
          }
        />
        <View className="mt-2">
          <Button
            label="Continuar comprando"
            variant="outline"
            fullWidth
            onPress={() => router.replace('/(client)/(tabs)/home')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
