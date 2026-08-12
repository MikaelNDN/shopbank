import { useMemo } from "react";
import { CreditCard, DollarSign, RefreshCw, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminDashboard } from "@/features/admin/application/useAdminCatalog";
import { useAdminReports } from "@/features/admin/application/useAdminOperations";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/AsyncState";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const paymentStatusClass: Record<string, string> = {
  APPROVED: "bg-success/15 text-success border-success/30",
  PENDING: "bg-warning/15 text-warning border-warning/30",
  CREATED: "bg-warning/15 text-warning border-warning/30",
  REJECTED: "bg-destructive/15 text-destructive border-destructive/30",
  CANCELED: "bg-destructive/15 text-destructive border-destructive/30",
  REFUNDED: "bg-muted text-muted-foreground border-border",
};

function paymentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    APPROVED: "Aprovado",
    PENDING: "Pendente",
    CREATED: "Criado",
    REJECTED: "Rejeitado",
    CANCELED: "Cancelado",
    REFUNDED: "Estornado",
  };
  return labels[status] ?? status;
}

export default function AdminFinanceiro() {
  const reportsQuery = useAdminReports();
  const dashboardQuery = useAdminDashboard("all");
  const loading = reportsQuery.isLoading || dashboardQuery.isLoading;
  const error = reportsQuery.isError || dashboardQuery.isError;
  const reports = reportsQuery.data;
  const dashboard = dashboardQuery.data;

  const paymentRows = useMemo(() => {
    if (!reports) return [];
    return Object.entries(reports.paymentsByStatus).map(([status, count]) => ({ status, count }));
  }, [reports]);

  const approvedPayments = paymentRows.find((row) => row.status === "APPROVED")?.count ?? 0;

  function refetchAll() {
    reportsQuery.refetch();
    dashboardQuery.refetch();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6" /> Financeiro
          </h1>
          <p className="text-sm text-muted-foreground">Receita, pagamentos e ticket medio com dados reais</p>
        </div>
        <Button variant="outline" onClick={refetchAll} disabled={reportsQuery.isFetching || dashboardQuery.isFetching}>
          <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent>
            <LoadingState message="Carregando financeiro..." />
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent>
            <ErrorState onRetry={refetchAll} />
          </CardContent>
        </Card>
      ) : !reports || !dashboard ? (
        <EmptyState title="Dados financeiros indisponíveis" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Receita aprovada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{BRL.format(reports.totalRevenue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Ticket medio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{BRL.format(dashboard.averageTicket)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Pagamentos aprovados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{approvedPayments}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Receita por mes</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {dashboard.revenueByMonth.length === 0 ? (
                  <EmptyState title="Sem receita mensal" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mes</TableHead>
                        <TableHead className="text-right">Receita</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard.revenueByMonth.map((row) => (
                        <TableRow key={row.month}>
                          <TableCell>{row.month}</TableCell>
                          <TableCell className="text-right font-medium">{BRL.format(row.value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pagamentos por status</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {paymentRows.length === 0 ? (
                  <EmptyState title="Sem pagamentos" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentRows.map((row) => (
                        <TableRow key={row.status}>
                          <TableCell>
                            <Badge variant="outline" className={paymentStatusClass[row.status] ?? "bg-muted text-muted-foreground border-border"}>
                              {paymentStatusLabel(row.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{row.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
