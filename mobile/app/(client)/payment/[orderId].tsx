import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import Toast from 'react-native-toast-message';

import {
  paymentApiHttp,
  type TransparentPayment,
} from '@/api/http/paymentApi';
import { orderApi } from '@/api/orderApi';
import { Button, Input, Loading } from '@/components/common';
import { useAbacatePayConfig } from '@/hooks/useAbacatePayConfig';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import type { Order, Payment } from '@/types/order';
import { formatCpf, unformatCpf } from '@/utils/formatCpf';
import { formatCurrency } from '@/utils/formatCurrency';
import { haptics } from '@/utils/haptics';

type PaymentMethod = 'pix' | 'boleto' | 'card';
type PaymentState = Payment | TransparentPayment;

WebBrowser.maybeCompleteAuthSession();

const SANDBOX_EMAIL = 'test@testuser.com';
const SANDBOX_CPF = '52998224725';
const SANDBOX_FIRST_NAME = 'Cliente';
const SANDBOX_LAST_NAME = 'Sandbox';

function qrImageUri(value?: string): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('data:image/')
    ? trimmed
    : `data:image/png;base64,${trimmed}`;
}

export default function PaymentScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { clear } = useCart();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { config, isLoading: configLoading, error: configError } = useAbacatePayConfig();

  const [order, setOrder] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('pix');
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<PaymentState | null>(null);
  const [cpf, setCpf] = useState(user?.cpf ? formatCpf(user.cpf) : '');

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cardReturnUrl = useMemo(
    () => (orderId ? Linking.createURL(`/payment/${orderId}`) : Linking.createURL('/')),
    [orderId],
  );

  useEffect(() => {
    if (!config?.sandbox) return;
    if (cpf !== formatCpf(SANDBOX_CPF)) setCpf(formatCpf(SANDBOX_CPF));
  }, [config?.sandbox, cpf]);

  useEffect(() => {
    if (!orderId) return;
    orderApi.getById(orderId).then((data) => {
      setOrder(data);
      setOrderLoading(false);
    });
  }, [orderId]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const completeApprovedPayment = useCallback(async () => {
    stopPolling();
    await clear();
    haptics.success();
    Toast.show({ type: 'success', text1: 'Pagamento aprovado' });
    router.replace(`/(client)/order-success/${orderId}`);
  }, [orderId, clear, router, stopPolling]);

  const showRejectedPayment = useCallback((updated: PaymentState) => {
    stopPolling();
    haptics.error();
    const statusDetail =
      'statusDetail' in updated && typeof updated.statusDetail === 'string'
        ? updated.statusDetail
        : undefined;
    Toast.show({
      type: 'error',
      text1: 'Pagamento rejeitado',
      text2: statusDetail ?? undefined,
    });
  }, [stopPolling]);

  const refreshPaymentStatus = useCallback(async () => {
    if (!orderId) return;
    const updated = await paymentApiHttp.refreshFromAbacatePay(orderId);
    if (!updated) return;
    setPayment(updated);
    if (updated.status === 'APPROVED') {
      await completeApprovedPayment();
    }
    if (updated.status === 'REJECTED') {
      showRejectedPayment(updated);
    }
  }, [orderId, completeApprovedPayment, showRejectedPayment]);

  const startPolling = useCallback(() => {
    stopPolling();
    if (!orderId) return;
    pollingRef.current = setInterval(() => {
      refreshPaymentStatus();
    }, 3000);
  }, [orderId, refreshPaymentStatus, stopPolling]);

  useFocusEffect(
    useCallback(() => {
      refreshPaymentStatus();
    }, [refreshPaymentStatus]),
  );

  const openCheckout = useCallback(async (redirectUrl: string) => {
    await WebBrowser.openAuthSessionAsync(redirectUrl, cardReturnUrl);
    await refreshPaymentStatus();
  }, [cardReturnUrl, refreshPaymentStatus]);

  const handlePaymentResult = useCallback(async (result: TransparentPayment) => {
    setPayment(result);
    haptics.medium();
    if (result.status === 'APPROVED') {
      await completeApprovedPayment();
      return;
    }
    if (result.status === 'REJECTED') {
      showRejectedPayment(result);
      return;
    }
    startPolling();
  }, [completeApprovedPayment, showRejectedPayment, startPolling]);

  const payerInfo = useMemo(
    () => ({
      payerEmail: config?.sandbox ? SANDBOX_EMAIL : user?.email ?? '',
      payerCpf: config?.sandbox ? SANDBOX_CPF : unformatCpf(cpf || user?.cpf || ''),
      payerFirstName: config?.sandbox ? SANDBOX_FIRST_NAME : user?.name?.split(' ')[0],
      payerLastName: config?.sandbox ? SANDBOX_LAST_NAME : user?.name?.split(' ').slice(1).join(' ') || undefined,
    }),
    [config?.sandbox, user, cpf],
  );

  const submitPix = async () => {
    if (!orderId) return;
    if (!payerInfo.payerCpf || payerInfo.payerCpf.length !== 11) {
      Toast.show({ type: 'error', text1: 'Informe um CPF válido' });
      return;
    }
    setSubmitting(true);
    try {
      const result = await paymentApiHttp.payWithPix(orderId, payerInfo);
      await handlePaymentResult(result);
    } catch (err) {
      haptics.error();
      Alert.alert('Erro', err instanceof Error ? err.message : 'Falhou');
    } finally {
      setSubmitting(false);
    }
  };

  const submitBoleto = async () => {
    if (!orderId) return;
    if (!payerInfo.payerCpf || payerInfo.payerCpf.length !== 11) {
      Toast.show({ type: 'error', text1: 'Informe um CPF válido' });
      return;
    }
    if (!payerInfo.payerFirstName || !payerInfo.payerLastName) {
      Toast.show({ type: 'error', text1: 'Nome completo obrigatório' });
      return;
    }
    setSubmitting(true);
    try {
      const result = await paymentApiHttp.payWithBoleto(orderId, {
        payerEmail: payerInfo.payerEmail,
        payerCpf: payerInfo.payerCpf,
        payerFirstName: payerInfo.payerFirstName,
        payerLastName: payerInfo.payerLastName,
      });
      await handlePaymentResult(result);
    } catch (err) {
      haptics.error();
      Alert.alert('Erro', err instanceof Error ? err.message : 'Falhou');
    } finally {
      setSubmitting(false);
    }
  };

  const submitCard = async () => {
    if (!orderId) return;
    if (!payerInfo.payerCpf || payerInfo.payerCpf.length !== 11) {
      Toast.show({ type: 'error', text1: 'Informe um CPF válido' });
      return;
    }
    setSubmitting(true);
    try {
      const result = await paymentApiHttp.payWithCard(orderId, {
        installments: 1,
        payerEmail: payerInfo.payerEmail,
        payerCpf: payerInfo.payerCpf,
        payerFirstName: payerInfo.payerFirstName,
        payerLastName: payerInfo.payerLastName,
        returnUrl: cardReturnUrl,
        completionUrl: cardReturnUrl,
      });
      setPayment(result);
      haptics.medium();
      if (result.redirectUrl) {
        await openCheckout(result.redirectUrl);
      }
      startPolling();
    } catch (err) {
      haptics.error();
      Alert.alert('Erro', err instanceof Error ? err.message : 'Falhou');
    } finally {
      setSubmitting(false);
    }
  };

  const copyPix = async () => {
    if (!payment?.qrCode) return;
    await Clipboard.setStringAsync(payment.qrCode);
    haptics.light();
    Toast.show({ type: 'success', text1: 'Código copiado' });
  };

  const openBoleto = async () => {
    if (payment?.method !== 'BOLETO' || !('boletoUrl' in payment) || !payment.boletoUrl) return;
    await Linking.openURL(payment.boletoUrl);
  };

  const openCardCheckout = async () => {
    if (payment?.method !== 'CREDIT_CARD' || !payment.redirectUrl) return;
    await openCheckout(payment.redirectUrl);
  };

  const simulateDevPayment = async () => {
    if (!payment?.id || !orderId) return;
    setSubmitting(true);
    try {
      if (payment.method === 'PIX' || payment.method === 'BOLETO') {
        const result = await paymentApiHttp.simulateAbacatePayPayment(orderId);
        await handlePaymentResult(result);
        return;
      }

      await paymentApiHttp.simulateApproval(payment.id);
      await completeApprovedPayment();
    } catch (err) {
      haptics.error();
      Alert.alert(
        'Falha ao simular',
        err instanceof Error ? err.message : 'Tente novamente',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const cancelOrder = () => {
    if (!orderId) return;
    Alert.alert('Cancelar pedido', 'Deseja cancelar este pedido?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim',
        style: 'destructive',
        onPress: async () => {
          try {
            await orderApi.cancel(orderId);
            stopPolling();
            Toast.show({ type: 'info', text1: 'Pedido cancelado' });
            router.replace('/(client)/(tabs)/cart');
          } catch (e) {
            Alert.alert('Erro', e instanceof Error ? e.message : 'Falhou');
          }
        },
      },
    ]);
  };

  if (orderLoading || configLoading) return <Loading message="Carregando..." />;
  if (configError || !config) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Text className="m-6 text-base text-danger">
          Falha ao carregar configuração de pagamento.
        </Text>
      </SafeAreaView>
    );
  }
  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Text className="m-6 text-base text-danger">Pedido não encontrado.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-row items-center px-6 py-4">
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <FontAwesome name="angle-left" size={24} color="#111827" />
          </Pressable>
          <View className="ml-3 flex-1">
            <Text className="text-xs text-muted">
              #{order.id.slice(-8).toUpperCase()}
            </Text>
            <Text className="text-xl font-bold text-gray-900">Pagamento</Text>
          </View>
          <Text className="text-base font-bold text-primary-600">
            {formatCurrency(order.total)}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
          <Pressable
            onPress={() => setSelectedMethod('card')}
            className={`mb-4 rounded-xl border p-4 ${
              selectedMethod === 'card'
                ? 'border-primary-500 bg-primary-50'
                : 'border-border bg-white'
            }`}
          >
            <View className="flex-row items-center gap-3">
              <FontAwesome
                name="credit-card"
                size={24}
                color={selectedMethod === 'card' ? '#b84613' : '#6b7280'}
              />
              <Text
                className={`text-lg font-semibold ${
                  selectedMethod === 'card' ? 'text-primary-700' : 'text-gray-900'
                }`}
              >
                Cartão de Débito
              </Text>
            </View>
            {selectedMethod === 'card' && (
              <View className="mt-4 border-t border-border pt-4">
                <CardView
                  cpf={cpf}
                  setCpf={setCpf}
                  payment={payment?.method === 'CREDIT_CARD' ? (payment as TransparentPayment) : null}
                  onSubmit={submitCard}
                  onOpen={openCardCheckout}
                  submitting={submitting}
                />
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => setSelectedMethod('pix')}
            className={`mb-4 rounded-xl border p-4 ${
              selectedMethod === 'pix'
                ? 'border-primary-500 bg-primary-50'
                : 'border-border bg-white'
            }`}
          >
            <View className="flex-row items-center gap-3">
              <FontAwesome
                name="qrcode"
                size={24}
                color={selectedMethod === 'pix' ? '#b84613' : '#6b7280'}
              />
              <Text
                className={`text-lg font-semibold ${
                  selectedMethod === 'pix' ? 'text-primary-700' : 'text-gray-900'
                }`}
              >
                PIX
              </Text>
            </View>
            {selectedMethod === 'pix' && (
              <View className="mt-4 border-t border-border pt-4">
                <PixView
                  cpf={cpf}
                  setCpf={setCpf}
                  payment={payment?.method === 'PIX' ? (payment as TransparentPayment) : null}
                  onSubmit={submitPix}
                  onCopy={copyPix}
                  onSimulate={simulateDevPayment}
                  submitting={submitting}
                />
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => setSelectedMethod('boleto')}
            className={`mb-4 rounded-xl border p-4 ${
              selectedMethod === 'boleto'
                ? 'border-primary-500 bg-primary-50'
                : 'border-border bg-white'
            }`}
          >
            <View className="flex-row items-center gap-3">
              <FontAwesome
                name="barcode"
                size={24}
                color={selectedMethod === 'boleto' ? '#b84613' : '#6b7280'}
              />
              <Text
                className={`text-lg font-semibold ${
                  selectedMethod === 'boleto' ? 'text-primary-700' : 'text-gray-900'
                }`}
              >
                Boleto
              </Text>
            </View>
            {selectedMethod === 'boleto' && (
              <View className="mt-4 border-t border-border pt-4">
                <BoletoView
                  cpf={cpf}
                  setCpf={setCpf}
                  payment={payment?.method === 'BOLETO' ? (payment as TransparentPayment) : null}
                  onSubmit={submitBoleto}
                  onOpen={openBoleto}
                  onSimulate={simulateDevPayment}
                  submitting={submitting}
                />
              </View>
            )}
          </Pressable>
        </ScrollView>

        <View className="absolute inset-x-0 bottom-0 border-t border-border bg-white px-6 py-3 pb-6">
          <Button
            label="Cancelar pedido"
            variant="ghost"
            fullWidth
            onPress={cancelOrder}
            disabled={submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface PixViewProps {
  cpf: string;
  setCpf: (v: string) => void;
  payment: TransparentPayment | null;
  onSubmit: () => void;
  onCopy: () => void;
  onSimulate: () => void;
  submitting: boolean;
}

function PixView({
  cpf,
  setCpf,
  payment,
  onSubmit,
  onCopy,
  onSimulate,
  submitting,
}: PixViewProps) {
  const imageUri = qrImageUri(payment?.qrCodeBase64);

  if (payment?.qrCode) {
    return (
      <View className="items-center gap-4">
        <View className="rounded-2xl border border-border bg-white p-3">
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: 240, height: 240 }}
              contentFit="contain"
            />
          ) : (
            <QRCode value={payment.qrCode} size={240} />
          )}
        </View>
        <Text className="text-sm font-semibold text-gray-900">
          Escaneie no app do seu banco
        </Text>
        <View className="w-full rounded-lg border border-border bg-surface p-3">
          <Text className="text-xs text-muted">PIX copia-cola</Text>
          <Text className="mt-1 text-[11px] text-gray-700" numberOfLines={3}>
            {payment.qrCode}
          </Text>
        </View>
        <Button label="Copiar código" variant="outline" fullWidth onPress={onCopy} />
        <View className="mt-2 flex-row items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3">
          <ActivityIndicator size="small" color="#b45309" />
          <Text className="flex-1 text-xs text-yellow-900">
            Aguardando confirmação do pagamento...
          </Text>
        </View>
        <View className="mt-2 w-full">
          <Button
            label="Simular Pix na AbacatePay"
            variant="ghost"
            fullWidth
            onPress={onSimulate}
            loading={submitting}
          />
        </View>
      </View>
    );
  }
  return (
    <View className="gap-4">
      <Text className="text-sm text-gray-700">
        Pague via PIX e tenha aprovação imediata.
      </Text>
      <Input
        label="CPF do pagador"
        keyboardType="number-pad"
        value={cpf}
        maxLength={14}
        onChangeText={(t) => setCpf(formatCpf(t))}
      />
      <Button
        label="Gerar QR Code PIX"
        size="lg"
        fullWidth
        onPress={onSubmit}
        loading={submitting}
      />
    </View>
  );
}

interface BoletoViewProps {
  cpf: string;
  setCpf: (v: string) => void;
  payment: TransparentPayment | null;
  onSubmit: () => void;
  onOpen: () => void;
  onSimulate: () => void;
  submitting: boolean;
}

function BoletoView({
  cpf,
  setCpf,
  payment,
  onSubmit,
  onOpen,
  onSimulate,
  submitting,
}: BoletoViewProps) {
  if (payment?.boletoUrl) {
    return (
      <View className="gap-4">
        <View className="items-center rounded-2xl border border-border bg-white p-6">
          <FontAwesome name="barcode" size={64} color="#b84613" />
          <Text className="mt-3 text-base font-semibold text-gray-900">
            Boleto gerado
          </Text>
          <Text className="mt-1 text-center text-xs text-muted">
            Aprovação em 1 a 3 dias úteis após o pagamento.
          </Text>
        </View>
        <Button label="Abrir boleto" size="lg" fullWidth onPress={onOpen} />
        <View className="mt-2 flex-row items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3">
          <ActivityIndicator size="small" color="#b45309" />
          <Text className="flex-1 text-xs text-yellow-900">
            Aguardando confirmação do pagamento...
          </Text>
        </View>
        <View className="mt-2 w-full">
          <Button
            label="Aprovar boleto local (dev)"
            variant="ghost"
            fullWidth
            onPress={onSimulate}
            loading={submitting}
          />
        </View>
      </View>
    );
  }
  return (
    <View className="gap-4">
      <Text className="text-sm text-gray-700">
        Boleto bancário com vencimento em 3 dias úteis.
      </Text>
      <Input
        label="CPF do pagador"
        keyboardType="number-pad"
        value={cpf}
        maxLength={14}
        onChangeText={(t) => setCpf(formatCpf(t))}
      />
      <Button
        label="Gerar boleto"
        size="lg"
        fullWidth
        onPress={onSubmit}
        loading={submitting}
      />
    </View>
  );
}

interface CardViewProps {
  cpf: string;
  setCpf: (v: string) => void;
  payment: TransparentPayment | null;
  onSubmit: () => void;
  onOpen: () => void;
  submitting: boolean;
}

function CardView({
  cpf,
  setCpf,
  payment,
  onSubmit,
  onOpen,
  submitting,
}: CardViewProps) {
  if (payment?.redirectUrl) {
    return (
      <View className="gap-4">
        <View className="items-center rounded-2xl border border-border bg-white p-6">
          <FontAwesome name="check-circle" size={64} color="#b84613" />
          <Text className="mt-3 text-base font-semibold text-gray-900">
            Pagamento em processamento
          </Text>
          <Text className="mt-1 text-center text-xs text-muted">
            Finalize o pagamento no checkout seguro da AbacatePay.
          </Text>
        </View>
        <Button label="Abrir checkout do cartão" size="lg" fullWidth onPress={onOpen} />
        <View className="mt-2 flex-row items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3">
          <ActivityIndicator size="small" color="#b45309" />
          <Text className="flex-1 text-xs text-yellow-900">
            Aguardando confirmação do pagamento...
          </Text>
        </View>
      </View>
    );
  }
  return (
    <View className="gap-4">
      <Text className="text-sm text-gray-700">
        Você será direcionado para o checkout seguro da AbacatePay.
      </Text>
      <Input
        label="CPF do titular"
        keyboardType="number-pad"
        value={cpf}
        maxLength={14}
        onChangeText={(t) => setCpf(formatCpf(t))}
      />
      <Button
        label="Ir para o checkout"
        size="lg"
        fullWidth
        onPress={onSubmit}
        loading={submitting}
      />
    </View>
  );
}
