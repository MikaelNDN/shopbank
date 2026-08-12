import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { checkingAccountApi } from '@/api/checkingAccountApi';
import { Button, Input } from '@/components/common';
import { parseCurrency } from '@/utils/formatCurrency';

export default function DepositScreen() {
  const router = useRouter();
  const { accountId } = useLocalSearchParams<{ accountId?: string }>();
  const [amountText, setAmountText] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleDeposit() {
    if (!accountId) return;
    const amount = parseCurrency(amountText);
    if (amount <= 0) {
      Toast.show({ type: 'error', text1: 'Informe um valor válido' });
      return;
    }
    setSubmitting(true);
    try {
      await checkingAccountApi.deposit(accountId, {
        amount,
        description: description || undefined,
      });
      Toast.show({ type: 'success', text1: 'Depósito realizado' });
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha no depósito';
      Toast.show({ type: 'error', text1: 'Depósito', text2: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-6 pt-4">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-2 active:opacity-60">
            <FontAwesome name="angle-left" size={28} color="#111827" />
          </Pressable>
          <Text className="text-lg font-semibold text-gray-900">Depositar</Text>
          <View className="w-10" />
        </View>
      </View>

      <View className="mt-6 gap-4 px-6">
        <Input
          label="Valor"
          placeholder="R$ 0,00"
          keyboardType="decimal-pad"
          value={amountText}
          onChangeText={setAmountText}
        />
        <Input
          label="Descrição (opcional)"
          placeholder="Ex: Top-up via Pix"
          value={description}
          onChangeText={setDescription}
        />
      </View>

      <View className="mt-auto px-6 pb-6">
        <Button
          label="Confirmar depósito"
          size="lg"
          fullWidth
          loading={submitting}
          onPress={handleDeposit}
        />
      </View>
    </SafeAreaView>
  );
}
