import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { checkingAccountApi } from '@/api/checkingAccountApi';
import { Loading } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import type { CheckingAccount } from '@/types/checkingAccount';
import { formatCurrency } from '@/utils/formatCurrency';

export default function AccountScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [account, setAccount] = useState<CheckingAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAccount = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const fresh = await checkingAccountApi.getByCustomer(user.id);
      setAccount(fresh);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar conta';
      Toast.show({ type: 'error', text1: 'Conta', text2: message });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchAccount();
    }, [fetchAccount]),
  );

  if (loading && !account) {
    return <Loading message="Carregando saldo..." />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-6 pt-4">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-2 active:opacity-60">
            <FontAwesome name="angle-left" size={28} color="#111827" />
          </Pressable>
          <Text className="text-lg font-semibold text-gray-900">Minha conta</Text>
          <View className="w-10" />
        </View>
      </View>

      <View className="mt-6 px-6">
        <View className="rounded-2xl bg-primary-500 p-6 shadow">
          <Text className="text-xs uppercase text-white/80">Saldo disponível</Text>
          <Text className="mt-2 text-3xl font-bold text-white">
            {formatCurrency(account?.balance ?? 0)}
          </Text>
          <View className="mt-4 flex-row gap-4">
            <Text className="text-xs text-white/70">Agência {account?.agency}</Text>
            <Text className="text-xs text-white/70">
              Conta {account?.number}-{account?.digit}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-6 flex-row gap-3 px-6">
        <ActionTile
          icon="arrow-down"
          label="Depositar"
          onPress={() => account && router.push(`/(client)/account/deposit?accountId=${account.id}`)}
          disabled={!account}
        />
        <ActionTile
          icon="arrow-up"
          label="Sacar"
          onPress={() => account && router.push(`/(client)/account/withdraw?accountId=${account.id}`)}
          disabled={!account}
        />
        <ActionTile
          icon="list"
          label="Extrato"
          onPress={() => account && router.push(`/(client)/account/statement?accountId=${account.id}`)}
          disabled={!account}
        />
      </View>

      <View className="mt-8 px-6">
        <Text className="text-xs uppercase text-muted">Dicas</Text>
        <View className="mt-2 rounded-lg border border-border bg-surface p-4">
          <Text className="text-sm text-gray-700">
            Para finalizar compras, mantenha saldo igual ou superior ao valor do pedido. Use o
            depósito para adicionar saldo.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

interface ActionTileProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

function ActionTile({ icon, label, onPress, disabled }: ActionTileProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      className={`flex-1 items-center rounded-xl border border-border bg-surface py-4 ${
        disabled ? 'opacity-50' : 'active:bg-gray-100'
      }`}
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-100">
        <FontAwesome name={icon} size={16} color="#ed751e" />
      </View>
      <Text className="mt-2 text-sm font-medium text-gray-900">{label}</Text>
    </Pressable>
  );
}
