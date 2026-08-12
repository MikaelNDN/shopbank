import { useCallback, useState } from 'react';
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  BarChart,
  LineChart,
  PieChart,
} from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { DashboardPeriod } from '@/api/adminApi';
import { Loading } from '@/components/common';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ChartCard } from '@/components/admin/ChartCard';
import { KpiCard } from '@/components/admin/KpiCard';
import { LowStockList } from '@/components/admin/LowStockList';
import { PeriodFilter } from '@/components/admin/PeriodFilter';
import { STATUS_LABEL } from '@/components/order/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { colors } from '@/theme/tokens';
import { formatCurrency } from '@/utils/formatCurrency';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CURRENCY_AXIS_LABEL_WIDTH = 58;
const COUNT_AXIS_LABEL_WIDTH = 30;

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: colors.warning,
  PAID: colors.success,
  SHIPPED: colors.secondary[600],
  DELIVERED: colors.primary[500],
  CANCELED: colors.danger,
};

function formatCurrencyAxisLabel(label: string): string {
  const value = Number(label);
  if (!Number.isFinite(value)) return label;

  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toLocaleString('pt-BR', {
      maximumFractionDigits: 1,
    })}M`;
  }

  if (abs >= 1_000) {
    return `R$ ${(value / 1_000).toLocaleString('pt-BR', {
      maximumFractionDigits: 1,
    })}k`;
  }

  return `R$ ${Math.round(value).toLocaleString('pt-BR')}`;
}

function formatCountAxisLabel(label: string): string {
  const value = Number(label);
  return Number.isFinite(value) ? String(Math.round(value)) : label;
}

function countAxisScale(maxValue: number) {
  const normalizedMax = Math.max(1, Math.ceil(maxValue));

  if (normalizedMax <= 4) {
    return {
      maxValue: normalizedMax,
      noOfSections: normalizedMax,
      stepValue: 1,
    };
  }

  const stepValue = Math.ceil(normalizedMax / 4);
  const noOfSections = Math.ceil(normalizedMax / stepValue);

  return {
    maxValue: noOfSections * stepValue,
    noOfSections,
    stepValue,
  };
}

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<DashboardPeriod>('30d');
  const { data, isLoading, refetch } = useDashboard(period);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading || !data) return <Loading message="Carregando dashboard..." />;

  const revenueByMonth = data.revenueByMonth.map((m, idx) => ({
    value: Math.round(m.value),
    label: m.month,
    dataPointText: m.value > 0 ? formatCurrency(m.value) : '',
    showXAxisIndex: idx === 0,
  }));

  const topProductsData = data.topProducts.map((p) => ({
    value: p.sold,
    label: p.name.length > 12 ? `${p.name.slice(0, 12)}…` : p.name,
    frontColor: colors.primary[500],
  }));
  const topProductsAxis = countAxisScale(
    Math.max(0, ...topProductsData.map((p) => p.value)),
  );

  const ordersByStatusData = data.ordersByStatus
    .filter((s) => s.count > 0)
    .map((s) => ({
      value: s.count,
      color: STATUS_COLORS[s.status] ?? colors.muted,
      text: String(s.count),
    }));

  const revenueByCategoryData = data.revenueByCategory
    .filter((c) => c.value > 0)
    .map((c) => ({
      value: Math.round(c.value),
      label: c.category.length > 10 ? `${c.category.slice(0, 10)}…` : c.category,
      frontColor: colors.secondary[500],
    }));

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AdminHeader
        title={`Olá, ${user?.name?.split(' ')[0] ?? 'admin'}`}
        subtitle="Visão geral da operação"
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="pb-3 pt-2">
          <PeriodFilter value={period} onChange={setPeriod} />
        </View>

        <View className="px-6">
          <Text className="mb-2 text-sm font-bold uppercase text-muted">
            Indicadores principais
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
        >
          <KpiCard
            label="Receita total"
            value={formatCurrency(data.totalRevenue)}
            icon="dollar"
            tone="primary"
            width={200}
          />
          <KpiCard
            label="Receita do mês"
            value={formatCurrency(data.monthRevenue)}
            icon="line-chart"
            tone="success"
            width={200}
          />
          <KpiCard
            label="Pedidos"
            value={String(data.totalOrders)}
            hint={`${data.paidOrders} pagos · ${data.pendingOrders} pendentes`}
            icon="shopping-bag"
            width={220}
          />
          <KpiCard
            label="Ticket médio"
            value={formatCurrency(data.averageTicket)}
            icon="credit-card"
            width={200}
          />
        </ScrollView>

        <View className="mt-6 px-6">
          <Text className="mb-2 text-sm font-bold uppercase text-muted">
            Operação
          </Text>
          <View className="gap-3">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <KpiCard
                  label="Pagos"
                  value={String(data.paidOrders)}
                  icon="check"
                  tone="success"
                />
              </View>
              <View className="flex-1">
                <KpiCard
                  label="Pendentes"
                  value={String(data.pendingOrders)}
                  icon="clock-o"
                  tone="warning"
                />
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <KpiCard
                  label="Cancelados"
                  value={String(data.canceledOrders)}
                  icon="times"
                  tone="danger"
                />
              </View>
              <View className="flex-1">
                <KpiCard
                  label="Unidades vendidas"
                  value={String(data.totalUnitsSold)}
                  icon="cubes"
                />
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <KpiCard
                  label="Produtos ativos"
                  value={String(data.activeProducts)}
                  icon="cube"
                />
              </View>
              <View className="flex-1">
                <KpiCard
                  label="Estoque baixo"
                  value={String(data.lowStockCount)}
                  icon="exclamation-triangle"
                  tone={data.lowStockCount > 0 ? 'warning' : 'neutral'}
                />
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <KpiCard
                  label="Clientes"
                  value={String(data.totalCustomers)}
                  icon="users"
                />
              </View>
              <View className="flex-1">
                <KpiCard
                  label="Mais vendido"
                  value={
                    data.bestSellingProduct
                      ? `${data.bestSellingProduct.sold} un.`
                      : '—'
                  }
                  hint={data.bestSellingProduct?.name}
                  icon="trophy"
                  tone="primary"
                />
              </View>
            </View>
          </View>
        </View>

        <View className="mt-6 gap-4 px-6">
          <Text className="text-sm font-bold uppercase text-muted">
            Gráficos
          </Text>

          <ChartCard
            title="Receita mês a mês"
            subtitle="Últimos 6 meses (pedidos pagos)"
          >
            {revenueByMonth.some((m) => m.value > 0) ? (
              <LineChart
                data={revenueByMonth}
                width={CHART_WIDTH - 32}
                height={180}
                color={colors.primary[500]}
                thickness={3}
                dataPointsColor={colors.primary[600]}
                yAxisColor={colors.border}
                xAxisColor={colors.border}
                yAxisLabelWidth={CURRENCY_AXIS_LABEL_WIDTH}
                yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.muted, fontSize: 10 }}
                formatYLabel={formatCurrencyAxisLabel}
                roundToDigits={0}
                noOfSections={4}
                spacing={Math.max(40, (CHART_WIDTH - 64) / 6)}
                initialSpacing={10}
                hideRules
                curved
              />
            ) : (
              <EmptyChart label="Sem receita registrada no período." />
            )}
          </ChartCard>

          <ChartCard
            title="Top produtos"
            subtitle="Mais vendidos no período"
          >
            {topProductsData.length > 0 ? (
              <BarChart
                data={topProductsData}
                width={CHART_WIDTH - 32}
                height={180}
                barWidth={28}
                barBorderRadius={6}
                yAxisColor={colors.border}
                xAxisColor={colors.border}
                yAxisLabelWidth={COUNT_AXIS_LABEL_WIDTH}
                yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
                xAxisLabelTextStyle={{
                  color: colors.muted,
                  fontSize: 10,
                  textAlign: 'center',
                }}
                formatYLabel={formatCountAxisLabel}
                maxValue={topProductsAxis.maxValue}
                noOfSections={topProductsAxis.noOfSections}
                stepValue={topProductsAxis.stepValue}
                spacing={16}
                initialSpacing={10}
                hideRules
              />
            ) : (
              <EmptyChart label="Sem vendas no período." />
            )}
          </ChartCard>

          <ChartCard
            title="Pedidos por status"
            subtitle={`Total: ${data.totalOrders}`}
          >
            {ordersByStatusData.length > 0 ? (
              <View className="flex-row items-center justify-between">
                <PieChart
                  data={ordersByStatusData}
                  donut
                  innerRadius={40}
                  radius={70}
                  showText
                  textColor="#fff"
                  textSize={11}
                />
                <View className="flex-1 gap-1.5 pl-4">
                  {data.ordersByStatus
                    .filter((s) => s.count > 0)
                    .map((s) => (
                      <View
                        key={s.status}
                        className="flex-row items-center gap-2"
                      >
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor:
                              STATUS_COLORS[s.status] ?? colors.muted,
                          }}
                        />
                        <Text className="flex-1 text-xs text-gray-700">
                          {STATUS_LABEL[s.status]}
                        </Text>
                        <Text className="text-xs font-semibold text-gray-900">
                          {s.count}
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            ) : (
              <EmptyChart label="Nenhum pedido no período." />
            )}
          </ChartCard>

          <ChartCard
            title="Receita por categoria"
            subtitle="Faturamento agregado"
          >
            {revenueByCategoryData.length > 0 ? (
              <BarChart
                data={revenueByCategoryData}
                width={CHART_WIDTH - 32}
                height={180}
                barWidth={28}
                barBorderRadius={6}
                yAxisColor={colors.border}
                xAxisColor={colors.border}
                yAxisLabelWidth={CURRENCY_AXIS_LABEL_WIDTH}
                yAxisTextStyle={{ color: colors.muted, fontSize: 10 }}
                xAxisLabelTextStyle={{
                  color: colors.muted,
                  fontSize: 10,
                  textAlign: 'center',
                }}
                formatYLabel={formatCurrencyAxisLabel}
                roundToDigits={0}
                noOfSections={4}
                spacing={16}
                initialSpacing={10}
                hideRules
              />
            ) : (
              <EmptyChart label="Sem receita por categoria no período." />
            )}
          </ChartCard>

          <ChartCard
            title="Estoque baixo"
            subtitle={`${data.lowStockCount} ${
              data.lowStockCount === 1 ? 'item crítico' : 'itens críticos'
            }`}
          >
            <LowStockList items={data.lowStockList} />
          </ChartCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <View className="items-center py-6">
      <Text className="text-sm text-muted">{label}</Text>
    </View>
  );
}
