import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { adminApi, type CustomerSummary } from '@/api/adminApi';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { CustomerRow } from '@/components/admin/CustomerRow';
import { EmptyState, Loading, SearchBar } from '@/components/common';
import { useDebounce } from '@/hooks/useDebounce';

export default function AdminCustomersListScreen() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const debounced = useDebounce(search, 300);

  const fetch = useCallback(async () => {
    const list = await adminApi.listCustomers(debounced);
    setCustomers(list);
    setLoading(false);
  }, [debounced]);

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

  if (loading) return <Loading message="Carregando clientes..." />;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AdminHeader
        title="Clientes"
        subtitle={`${customers.length} cadastrados`}
      />

      <View className="px-6 pb-3">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nome ou e-mail..."
        />
      </View>

      {customers.length === 0 ? (
        <EmptyState
          icon="users"
          title="Nenhum cliente encontrado"
          description="Ajuste a busca."
        />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(it) => it.user.id}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 32,
            gap: 10,
          }}
          renderItem={({ item }) => (
            <CustomerRow
              customer={item}
              onPress={() =>
                router.push(`/(admin)/customers/${item.user.id}`)
              }
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
