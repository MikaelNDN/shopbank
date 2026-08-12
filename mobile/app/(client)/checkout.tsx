import FontAwesome from '@expo/vector-icons/FontAwesome';
import { type BottomSheetModal } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { checkingAccountApi } from '@/api/checkingAccountApi';
import { orderApi } from '@/api/orderApi';
import { Button, EmptyState, Loading } from '@/components/common';
import { AddressSelector } from '@/components/order/AddressSelector';
import { OrderSummary } from '@/components/order/OrderSummary';
import { useAddresses } from '@/hooks/useAddresses';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import type { Address } from '@/types/address';
import type { CheckingAccount } from '@/types/checkingAccount';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatZipCode } from '@/utils/formatZipCode';
import { haptics } from '@/utils/haptics';

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, subtotal, itemCount, hasUnavailableItems, isLoading } =
    useCart();
  const { addresses, favorite, refetch: refetchAddresses } = useAddresses();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [account, setAccount] = useState<CheckingAccount | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);

  const addressSheetRef = useRef<BottomSheetModal>(null);

  const fetchAccount = useCallback(async () => {
    if (!user?.id) return;
    setLoadingAccount(true);
    try {
      const fresh = await checkingAccountApi.getByCustomer(user.id);
      setAccount(fresh);
    } catch {
      setAccount(null);
    } finally {
      setLoadingAccount(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      refetchAddresses();
      fetchAccount();
    }, [refetchAddresses, fetchAccount]),
  );

  useEffect(() => {
    if (selectedAddress) {
      const stillExists = addresses.find((a) => a.id === selectedAddress.id);
      if (stillExists) {
        setSelectedAddress(stillExists);
        return;
      }
    }
    if (favorite) {
      setSelectedAddress(favorite);
    } else if (addresses.length > 0) {
      setSelectedAddress(addresses[0]);
    } else {
      setSelectedAddress(null);
    }
  }, [favorite, addresses, selectedAddress]);

  if (isLoading) return <Loading message="Carregando..." />;

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <Header title="Checkout" onBack={() => router.back()} />
        <EmptyState
          icon="shopping-cart"
          title="Carrinho vazio"
          description="Adicione itens antes de finalizar."
          ctaLabel="Voltar para a loja"
          onCtaPress={() => router.replace('/(client)/(tabs)/products')}
        />
      </SafeAreaView>
    );
  }

  const submit = async () => {
    if (!user) return;
    if (hasUnavailableItems) {
      Toast.show({
        type: 'error',
        text1: 'Itens indisponíveis',
        text2: 'Volte ao carrinho para ajustar.',
      });
      return;
    }
    if (!selectedAddress) {
      Toast.show({
        type: 'error',
        text1: 'Selecione um endereço',
      });
      return;
    }
    if (!account || account.balance < subtotal) {
      Toast.show({
        type: 'error',
        text1: 'Saldo insuficiente',
        text2: 'Adicione saldo na sua conta antes de finalizar.',
      });
      return;
    }
    setSubmitting(true);
    try {
      const order = await orderApi.create({
        customerId: user.id,
        items,
        shippingAddress: selectedAddress,
        paymentMethod: 'ABACATEPAY',
      });
      haptics.success();
      router.replace(`/(client)/payment/${order.id}`);
    } catch (e) {
      Alert.alert(
        'Erro',
        e instanceof Error ? e.message : 'Não foi possível criar o pedido',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Header title="Checkout" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <Section title="Endereço de entrega">
          {selectedAddress ? (
            <Pressable
              onPress={() => addressSheetRef.current?.present()}
              className="rounded-xl border border-border bg-white p-4 active:bg-surface"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <FontAwesome name="map-marker" size={14} color="#ed751e" />
                  <Text className="text-sm font-semibold text-gray-900">
                    {selectedAddress.label}
                  </Text>
                  {selectedAddress.isFavorite ? (
                    <View className="rounded-full bg-primary-50 px-2 py-0.5">
                      <Text className="text-[10px] font-semibold text-primary-700">
                        Favorito
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text className="text-xs font-semibold text-primary-600">
                  Trocar
                </Text>
              </View>
              <Text className="mt-2 text-sm text-gray-700">
                {selectedAddress.street}, {selectedAddress.number}
                {selectedAddress.complement
                  ? ` - ${selectedAddress.complement}`
                  : ''}
              </Text>
              <Text className="text-xs text-muted">
                {selectedAddress.neighborhood} · {selectedAddress.city}/
                {selectedAddress.state} · CEP{' '}
                {formatZipCode(selectedAddress.zipCode)}
              </Text>
            </Pressable>
          ) : (
            <View className="rounded-xl border border-dashed border-border bg-surface p-4">
              <Text className="text-sm text-gray-700">
                Você não tem endereços cadastrados.
              </Text>
              <View className="mt-3">
                <Button
                  label="Cadastrar endereço"
                  onPress={() => router.push('/(client)/addresses/new')}
                />
              </View>
            </View>
          )}
        </Section>

        <Section title={`Itens (${itemCount})`}>
          <View className="gap-3">
            {items.map((item) => (
              <View
                key={item.productId}
                className="flex-row gap-3 rounded-xl border border-border bg-white p-3"
              >
                <View className="h-16 w-16 overflow-hidden rounded-lg bg-surface">
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
            <Pressable
              onPress={() => router.push('/(client)/(tabs)/cart')}
              className="self-end"
              hitSlop={8}
            >
              <Text className="text-xs font-semibold text-primary-600">
                Editar carrinho
              </Text>
            </Pressable>
          </View>
        </Section>

        <Section title="Saldo da conta">
          <BalanceBanner
            account={account}
            subtotal={subtotal}
            loading={loadingAccount}
            onTopUp={() =>
              account
                ? router.push(`/(client)/account/deposit?accountId=${account.id}`)
                : router.push('/(client)/account')
            }
          />
        </Section>

        <Section title="Resumo">
          <OrderSummary subtotal={subtotal} itemCount={itemCount} />
        </Section>
      </ScrollView>

      <View className="absolute inset-x-0 bottom-0 border-t border-border bg-white px-6 py-4 pb-6">
        <Button
          label={`Continuar para pagamento · ${formatCurrency(subtotal)}`}
          size="lg"
          fullWidth
          loading={submitting}
          disabled={
            !selectedAddress ||
            hasUnavailableItems ||
            !account ||
            account.balance < subtotal
          }
          onPress={submit}
        />
      </View>

      <AddressSelector
        ref={addressSheetRef}
        addresses={addresses}
        selectedId={selectedAddress?.id}
        onSelect={(addr) => {
          setSelectedAddress(addr);
          addressSheetRef.current?.dismiss();
        }}
      />
    </SafeAreaView>
  );
}

interface HeaderProps {
  title: string;
  onBack: () => void;
}

function Header({ title, onBack }: HeaderProps) {
  return (
    <View className="flex-row items-center px-6 py-4">
      <Pressable onPress={onBack} hitSlop={12}>
        <FontAwesome name="angle-left" size={24} color="#111827" />
      </Pressable>
      <Text className="ml-3 text-2xl font-bold text-gray-900">{title}</Text>
    </View>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View className="px-6 pt-4">
      <Text className="mb-3 text-sm font-bold uppercase text-muted">
        {title}
      </Text>
      {children}
    </View>
  );
}

interface BalanceBannerProps {
  account: CheckingAccount | null;
  subtotal: number;
  loading: boolean;
  onTopUp: () => void;
}

function BalanceBanner({ account, subtotal, loading, onTopUp }: BalanceBannerProps) {
  if (loading && !account) {
    return (
      <View className="rounded-xl border border-border bg-surface p-4">
        <Text className="text-sm text-muted">Carregando saldo...</Text>
      </View>
    );
  }

  if (!account) {
    return (
      <View className="rounded-xl border border-danger/30 bg-danger/5 p-4">
        <Text className="text-sm font-semibold text-danger">Conta não encontrada</Text>
        <Text className="mt-1 text-xs text-gray-700">
          Cadastre uma conta para finalizar compras.
        </Text>
        <View className="mt-3">
          <Button label="Abrir conta" onPress={onTopUp} variant="outline" />
        </View>
      </View>
    );
  }

  const insufficient = account.balance < subtotal;
  const missing = Math.max(0, subtotal - account.balance);

  return (
    <View
      className={`rounded-xl border p-4 ${
        insufficient ? 'border-danger/40 bg-danger/5' : 'border-border bg-white'
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-xs uppercase text-muted">Saldo atual</Text>
          <Text
            className={`mt-1 text-xl font-bold ${
              insufficient ? 'text-danger' : 'text-gray-900'
            }`}
          >
            {formatCurrency(account.balance)}
          </Text>
        </View>
        <FontAwesome
          name={insufficient ? 'exclamation-triangle' : 'check-circle'}
          size={28}
          color={insufficient ? '#dc2626' : '#16a34a'}
        />
      </View>

      {insufficient ? (
        <>
          <Text className="mt-2 text-sm text-danger">
            Faltam {formatCurrency(missing)} para finalizar o pedido.
          </Text>
          <View className="mt-3">
            <Button label="Depositar agora" onPress={onTopUp} />
          </View>
        </>
      ) : null}
    </View>
  );
}
