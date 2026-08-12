import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, DollarSign, Package, Plus, Tags, XCircle } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminDashboard } from "@/features/admin/application/useAdminCatalog";
import type { DashboardPeriod } from "@/features/admin/domain/admin";
import { orderStatusUi } from "@/features/orders/presentation/orderStatusUi";
import { ErrorState, LoadingState } from "@/shared/ui/AsyncState";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const STATUS_COLORS = {
  PENDING_PAYMENT: "hsl(var(--warning))",
  PAID: "hsl(var(--success))",
  SHIPPED: "hsl(var(--primary))",
  DELIVERED: "hsl(var(--success))",
  CANCELED: "hsl(var(--destructive))",
};

export default function Dashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const dashboardQuery = useAdminDashboard(period);
  const data = dashboardQuery.data;

  if (dashboardQuery.isLoading) {
    return (
      <Card>
        <CardContent>
          <LoadingState message="Carregando dashboard..." />
        </CardContent>
      </Card>
    );
  }

  if (dashboardQuery.isError || !data) {
    return (
      <Card>
        <CardContent>
          <ErrorState onRetry={() => dashboardQuery.refetch()} />
        </CardContent>
      </Card>
    );
  }

  const stats = [
    { label: "Total de pedidos", value: String(data.totalOrders), icon: Package, tone: "text-primary" },
    { label: "Pedidos pagos", value: String(data.paidOrders), icon: CheckCircle2, tone: "text-success" },
    { label: "Cancelados", value: String(data.canceledOrders), icon: XCircle, tone: "text-destructive" },
    { label: "Faturamento", value: BRL.format(data.totalRevenue), icon: DollarSign, tone: "text-primary" },
    { label: "Estoque baixo", value: String(data.lowStockCount), icon: AlertTriangle, tone: "text-warning" },
  ];

  const orderStatusData = data.ordersByStatus
    .filter((item) => item.count > 0)
    .map((item) => ({
      name: orderStatusUi[item.status].label,
      value: item.count,
      color: STATUS_COLORS[item.status],
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visao geral da loja e operacoes</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/produtos">
              <Plus className="h-4 w-4 mr-2" /> Produto
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/categorias">
              <Tags className="h-4 w-4 mr-2" /> Categoria
            </Link>
          </Button>
          <Select value={period} onValueChange={(value) => setPeriod(value as DashboardPeriod)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="all">Tudo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.tone}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Faturamento por categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `R$${(Number(value) / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => BRL.format(value)}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pedidos por status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {orderStatusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top produtos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem vendas no periodo.</p>
            ) : (
              data.topProducts.map((product) => (
                <div key={`${product.id ?? product.name}`} className="flex items-center justify-between text-sm">
                  <span>{product.name}</span>
                  <Badge variant="outline">{product.sold} un.</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estoque baixo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.lowStockList.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum item critico.</p>
            ) : (
              data.lowStockList.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span>{item.name}</span>
                  <Badge variant="outline" className="text-warning">{item.qty} un.</Badge>
                </div>
              ))
            )}
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/estoque">Gerenciar estoque</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
