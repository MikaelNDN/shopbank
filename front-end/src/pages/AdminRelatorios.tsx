import { useMemo, useRef } from "react";
import { BarChart3, Download, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
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
import { useAdminReports } from "@/features/admin/application/useAdminOperations";
import type { OrderStatus } from "@/features/orders/domain/order";
import { orderStatusUi } from "@/features/orders/presentation/orderStatusUi";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/AsyncState";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const orderStatusOrder: OrderStatus[] = ["PENDING_PAYMENT", "PAID", "SHIPPED", "DELIVERED", "CANCELED"];

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

export default function AdminRelatorios() {
  const reportsQuery = useAdminReports();
  const printRef = useRef<HTMLDivElement>(null);
  const data = reportsQuery.data;

  const orderRows = useMemo(() => {
    if (!data) return [];
    return orderStatusOrder.map((status) => ({
      status,
      count: data.ordersByStatus[status] ?? 0,
    }));
  }, [data]);

  const paymentRows = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.paymentsByStatus).map(([status, count]) => ({ status, count }));
  }, [data]);

  const totalOrders = orderRows.reduce((sum, row) => sum + row.count, 0);
  const totalPayments = paymentRows.reduce((sum, row) => sum + row.count, 0);

  function exportCSV() {
    if (!data) return;
    const lines = [
      ["Secao", "Status", "Quantidade", "Valor"],
      ...orderRows.map((row) => ["Pedidos", orderStatusUi[row.status].label, String(row.count), ""]),
      ...paymentRows.map((row) => ["Pagamentos", paymentStatusLabel(row.status), String(row.count), ""]),
      ["Receita", "Total aprovado", "", data.totalRevenue.toFixed(2).replace(".", ",")],
    ];
    const csv = lines
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "relatorio_admin.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  }

  function exportPDF() {
    const html = printRef.current?.innerHTML;
    if (!html) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) {
      toast.error("Bloqueador de pop-ups impediu a exportacao");
      return;
    }
    win.document.write(`<!doctype html><html><head><title>Relatório administrativo</title>
      <style>
        body{font-family:system-ui,Arial,sans-serif;padding:24px;color:#111}
        table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}
        th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
        th{background:#f4f4f5}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:12px 0}
        .card{border:1px solid #e4e4e7;border-radius:8px;padding:12px}.muted{color:#71717a;font-size:11px}
      </style></head><body>${html}<script>window.onload=()=>window.print();</script></body></html>`);
    win.document.close();
    toast.success("PDF pronto para impressao");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6" /> Relatorios
          </h1>
          <p className="text-sm text-muted-foreground">Consolidado real de pedidos, pagamentos e receita</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} disabled={!data}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" onClick={exportPDF} disabled={!data}>
            <Printer className="h-4 w-4 mr-2" /> PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Fonte de dados
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Os numeros desta tela vem de <code>GET /api/admin/reports</code>. O endpoint atual retorna agregados globais,
          sem filtro de periodo.
        </CardContent>
      </Card>

      {reportsQuery.isLoading ? (
        <Card>
          <CardContent>
            <LoadingState message="Carregando relatórios..." />
          </CardContent>
        </Card>
      ) : reportsQuery.isError ? (
        <Card>
          <CardContent>
            <ErrorState onRetry={() => reportsQuery.refetch()} />
          </CardContent>
        </Card>
      ) : !data ? (
        <EmptyState title="Relatório indisponível" />
      ) : (
        <div ref={printRef} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Relatório administrativo</h2>
                <p className="text-xs text-muted-foreground">Gerado em {new Date().toLocaleString("pt-BR")}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground">Receita aprovada</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">{BRL.format(data.totalRevenue)}</div>
                  </CardContent>
                </Card>
                <Card className="shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground">Pedidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">{totalOrders}</div>
                  </CardContent>
                </Card>
                <Card className="shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground">Pagamentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">{totalPayments}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">Pedidos por status</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Quantidade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderRows.map((row) => (
                          <TableRow key={row.status}>
                            <TableCell>
                              <Badge variant="outline" className={orderStatusUi[row.status].className}>
                                {orderStatusUi[row.status].label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">{row.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle className="text-base">Pagamentos por status</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {paymentRows.length === 0 ? (
                      <EmptyState title="Sem pagamentos no relatório" />
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
        </div>
      )}
    </div>
  );
}
