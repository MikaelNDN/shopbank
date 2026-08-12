import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { adminApi, type ReportsData } from '@/api/adminApi';
import { orderApi } from '@/api/orderApi';
import { productApi } from '@/api/productApi';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ChartCard } from '@/components/admin/ChartCard';
import { Button, Loading } from '@/components/common';
import { colors } from '@/theme/tokens';
import { exportCsv } from '@/utils/exportCsv';
import { formatCurrency } from '@/utils/formatCurrency';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

export default function AdminReportsScreen() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetch = useCallback(async () => {
    const d = await adminApi.getReports();
    setData(d);
    setLoading(false);
  }, []);

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

  const exportOrders = async () => {
    setExporting(true);
    try {
      const orders = await orderApi.listAll();
      await exportCsv(
        `pedidos-${Date.now()}.csv`,
        orders,
        [
          { header: 'ID', value: (o) => o.id },
          { header: 'Status', value: (o) => o.status },
          { header: 'Cliente', value: (o) => o.customerId },
          { header: 'Itens', value: (o) => o.items.length },
          { header: 'Total', value: (o) => o.total.toFixed(2) },
          { header: 'Pagamento', value: (o) => o.paymentMethod },
          { header: 'Criado em', value: (o) => o.createdAt },
        ],
      );
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Falha no export',
        text2: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setExporting(false);
    }
  };

  const exportProducts = async () => {
    setExporting(true);
    try {
      const products = await productApi.listAll({ includeInactive: true });
      await exportCsv(
        `produtos-${Date.now()}.csv`,
        products,
        [
          { header: 'ID', value: (p) => p.id },
          { header: 'Nome', value: (p) => p.name },
          { header: 'Categoria', value: (p) => p.categoryId },
          { header: 'Preço', value: (p) => p.price.toFixed(2) },
          { header: 'Estoque', value: (p) => p.availableQuantity },
          { header: 'Ativo', value: (p) => (p.active ? 'Sim' : 'Não') },
        ],
      );
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Falha no export',
        text2: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setExporting(false);
    }
  };

  const exportCustomers = async () => {
    setExporting(true);
    try {
      const customers = await adminApi.listCustomers();
      await exportCsv(
        `clientes-${Date.now()}.csv`,
        customers,
        [
          { header: 'ID', value: (c) => c.user.id },
          { header: 'Nome', value: (c) => c.user.name },
          { header: 'E-mail', value: (c) => c.user.email },
          { header: 'Pedidos', value: (c) => c.totalOrders },
          { header: 'Total gasto', value: (c) => c.totalSpent.toFixed(2) },
          {
            header: 'Ticket médio',
            value: (c) => c.averageTicket.toFixed(2),
          },
        ],
      );
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Falha no export',
        text2: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading || !data) return <Loading message="Carregando relatórios..." />;

  const dayChart = data.revenueByDayOfWeek.map((d) => ({
    value: Math.round(d.value),
    label: d.label,
    frontColor: colors.primary[500],
  }));

  const categoryChart = data.categoryRevenue
    .filter((c) => c.value > 0)
    .map((c) => ({
      value: Math.round(c.value),
      label: c.category.length > 8 ? `${c.category.slice(0, 8)}…` : c.category,
      frontColor: colors.secondary[500],
    }));

  const { current, previous, deltaPercent } = data.monthlyComparison;
  const positive = deltaPercent >= 0;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AdminHeader title="Relatórios" subtitle="Análises e exportações" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="gap-4 px-6">
          <ChartCard
            title="Mês atual vs mês anterior"
            subtitle="Receita de pedidos pagos"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-muted">Atual</Text>
                <Text className="text-xl font-bold text-gray-900">
                  {formatCurrency(current)}
                </Text>
              </View>
              <View
                className={`rounded-full px-3 py-1 ${
                  positive ? 'bg-success/15' : 'bg-danger/10'
                }`}
              >
                <View className="flex-row items-center gap-1">
                  <FontAwesome
                    name={positive ? 'arrow-up' : 'arrow-down'}
                    size={10}
                    color={positive ? '#16a34a' : '#dc2626'}
                  />
                  <Text
                    className={`text-xs font-bold ${
                      positive ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {Math.abs(deltaPercent).toFixed(1)}%
                  </Text>
                </View>
              </View>
              <View>
                <Text className="text-xs text-muted">Anterior</Text>
                <Text className="text-xl font-bold text-gray-900">
                  {formatCurrency(previous)}
                </Text>
              </View>
            </View>
          </ChartCard>

          <ChartCard
            title="Receita por dia da semana"
            subtitle="Soma histórica"
          >
            {dayChart.some((d) => d.value > 0) ? (
              <BarChart
                data={dayChart}
                width={CHART_WIDTH - 32}
                height={180}
                barWidth={26}
                barBorderRadius={6}
                yAxisColor={colors.border}
                xAxisColor={colors.border}
                yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
                xAxisLabelTextStyle={{
                  color: colors.muted,
                  fontSize: 10,
                  textAlign: 'center',
                }}
                yAxisLabelPrefix="R$ "
                noOfSections={4}
                spacing={14}
                initialSpacing={10}
                hideRules
              />
            ) : (
              <Text className="py-6 text-center text-sm text-muted">
                Sem receita registrada.
              </Text>
            )}
          </ChartCard>

          <ChartCard title="Receita por categoria" subtitle="Histórico total">
            {categoryChart.length > 0 ? (
              <BarChart
                data={categoryChart}
                width={CHART_WIDTH - 32}
                height={180}
                barWidth={28}
                barBorderRadius={6}
                yAxisColor={colors.border}
                xAxisColor={colors.border}
                yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
                xAxisLabelTextStyle={{
                  color: colors.muted,
                  fontSize: 10,
                  textAlign: 'center',
                }}
                yAxisLabelPrefix="R$ "
                noOfSections={4}
                spacing={16}
                initialSpacing={10}
                hideRules
              />
            ) : (
              <Text className="py-6 text-center text-sm text-muted">
                Sem dados.
              </Text>
            )}
          </ChartCard>

          <ChartCard
            title="Top clientes"
            subtitle={`${data.topCustomers.length} clientes ranqueados`}
          >
            {data.topCustomers.length === 0 ? (
              <Text className="py-6 text-center text-sm text-muted">
                Sem pedidos registrados.
              </Text>
            ) : (
              <View className="gap-2">
                {data.topCustomers.map((c, idx) => (
                  <View
                    key={c.user.id}
                    className="flex-row items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2"
                  >
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-primary-50">
                      <Text className="text-xs font-bold text-primary-700">
                        {idx + 1}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-sm font-semibold text-gray-900"
                        numberOfLines={1}
                      >
                        {c.user.name}
                      </Text>
                      <Text className="text-xs text-muted">
                        {c.orderCount}{' '}
                        {c.orderCount === 1 ? 'pedido' : 'pedidos'}
                      </Text>
                    </View>
                    <Text className="text-sm font-bold text-primary-600">
                      {formatCurrency(c.total)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ChartCard>

          <ChartCard title="Exportar CSV" subtitle="Compartilhar dados">
            <View className="gap-2">
              <Button
                label="Exportar pedidos"
                variant="outline"
                fullWidth
                loading={exporting}
                onPress={exportOrders}
                leftIcon={
                  <FontAwesome name="shopping-bag" size={14} color="#b84613" />
                }
              />
              <Button
                label="Exportar produtos"
                variant="outline"
                fullWidth
                loading={exporting}
                onPress={exportProducts}
                leftIcon={
                  <FontAwesome name="cube" size={14} color="#b84613" />
                }
              />
              <Button
                label="Exportar clientes"
                variant="outline"
                fullWidth
                loading={exporting}
                onPress={exportCustomers}
                leftIcon={
                  <FontAwesome name="users" size={14} color="#b84613" />
                }
              />
            </View>
          </ChartCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
