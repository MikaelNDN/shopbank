import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { checkingAccountApi } from '@/api/checkingAccountApi';
import { EmptyState, Loading } from '@/components/common';
import type { AccountTransaction, TransactionType } from '@/types/checkingAccount';
import { formatCurrency } from '@/utils/formatCurrency';

const FILTERS: { label: string; value?: TransactionType }[] = [
  { label: 'Todas', value: undefined },
  { label: 'Crédito', value: 'CREDIT' },
  { label: 'Débito', value: 'DEBIT' },
  { label: 'Depósito', value: 'DEPOSIT' },
  { label: 'Saque', value: 'WITHDRAWAL' },
  { label: 'Reembolso', value: 'REFUND' },
];

export default function StatementScreen() {
  const router = useRouter();
  const { accountId } = useLocalSearchParams<{ accountId?: string }>();
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<TransactionType | undefined>(undefined);

  const fetchTransactions = useCallback(
    async (filter?: TransactionType) => {
      if (!accountId) return;
      setLoading(true);
      try {
        const result = await checkingAccountApi.listTransactions(accountId, {
          type: filter,
        });
        setTransactions(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao carregar extrato';
        Toast.show({ type: 'error', text1: 'Extrato', text2: message });
      } finally {
        setLoading(false);
      }
    },
    [accountId],
  );

  useFocusEffect(
    useCallback(() => {
      fetchTransactions(activeFilter);
    }, [fetchTransactions, activeFilter]),
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-6 pt-4">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-2 active:opacity-60">
            <FontAwesome name="angle-left" size={28} color="#111827" />
          </Pressable>
          <Text className="text-lg font-semibold text-gray-900">Extrato</Text>
          <View className="w-10" />
        </View>
      </View>

      <View className="mt-4 px-6">
        <FlatList
          data={FILTERS}
          keyExtractor={(item) => item.value ?? 'all'}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const selected = item.value === activeFilter;
            return (
              <Pressable
                onPress={() => setActiveFilter(item.value)}
                className={`mr-2 rounded-full border px-4 py-2 ${
                  selected
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-border bg-surface'
                }`}
              >
                <Text className={selected ? 'text-white' : 'text-gray-700'}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {loading ? (
        <Loading message="Carregando..." />
      ) : transactions.length === 0 ? (
        <View className="flex-1">
          <EmptyState title="Sem movimentações" description="Nenhuma transação encontrada." />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, gap: 12 }}
          renderItem={({ item }) => <TransactionRow tx={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function TransactionRow({ tx }: { tx: AccountTransaction }) {
  const isCredit = tx.type === 'CREDIT' || tx.type === 'DEPOSIT' || tx.type === 'REFUND';
  const sign = isCredit ? '+' : '-';
  const color = isCredit ? 'text-success' : 'text-danger';
  const labelByType: Record<TransactionType, string> = {
    CREDIT: 'Crédito',
    DEBIT: 'Débito',
    REFUND: 'Reembolso',
    DEPOSIT: 'Depósito',
    WITHDRAWAL: 'Saque',
  };

  return (
    <View className="rounded-lg border border-border bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-gray-900">{labelByType[tx.type]}</Text>
        <Text className={`text-base font-semibold ${color}`}>
          {sign}
          {formatCurrency(tx.amount)}
        </Text>
      </View>
      {tx.description ? (
        <Text className="mt-1 text-sm text-muted">{tx.description}</Text>
      ) : null}
      <Text className="mt-2 text-xs text-muted">
        {new Date(tx.createdAt).toLocaleString('pt-BR')}
      </Text>
    </View>
  );
}
