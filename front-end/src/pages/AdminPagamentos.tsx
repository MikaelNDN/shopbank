import { useMemo, useState } from "react";
import { CreditCard, Eye, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableHeader } from "@/components/common/SortableHeader";
import { TablePagination } from "@/components/common/TablePagination";
import { useTableState } from "@/hooks/useTableState";
import { useAdminPayments } from "@/features/admin/application/useAdminOperations";
import type { AdminPaymentRecord } from "@/features/admin/domain/admin";
import type { PaymentStatus } from "@/features/payments/domain/payment";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/AsyncState";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const paymentStatusUi: Record<PaymentStatus, { label: string; className: string }> = {
  PENDING: { label: "Pendente", className: "bg-warning/15 text-warning border-warning/30" },
  APPROVED: { label: "Aprovado", className: "bg-success/15 text-success border-success/30" },
  REJECTED: { label: "Rejeitado", className: "bg-destructive/15 text-destructive border-destructive/30" },
  REFUNDED: { label: "Estornado", className: "bg-muted text-muted-foreground border-border" },
};

type StatusFilter = "ALL" | PaymentStatus;

interface PaymentRow {
  id: string;
  orderId: string;
  customerName: string;
  method: string;
  status: PaymentStatus;
  amount: number;
  createdAt: string;
  record: AdminPaymentRecord;
}

export default function AdminPagamentos() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selected, setSelected] = useState<AdminPaymentRecord | null>(null);

  const paymentsQuery = useAdminPayments({
    search,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });

  const rows = useMemo<PaymentRow[]>(() => {
    return (paymentsQuery.data ?? []).map((record) => ({
      id: record.payment.id,
      orderId: record.payment.orderId,
      customerName: record.customer.name,
      method: record.payment.method,
      status: record.payment.status,
      amount: record.payment.amount,
      createdAt: record.payment.createdAt,
      record,
    }));
  }, [paymentsQuery.data]);

  const table = useTableState<PaymentRow>(rows, {
    initialSort: { key: "createdAt", dir: "desc" },
    pageSize: 10,
  });

  const approvedTotal = rows
    .filter((row) => row.status === "APPROVED")
    .reduce((sum, row) => sum + row.amount, 0);
  const pendingTotal = rows
    .filter((row) => row.status === "PENDING")
    .reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6" /> Pagamentos
          </h1>
          <p className="text-sm text-muted-foreground">Pagamentos consultados a partir dos pedidos reais</p>
        </div>
        <Badge variant="secondary" className="bg-accent text-accent-foreground">
          {rows.length} pagamento(s)
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Transacoes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{rows.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Aprovado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-success">{BRL.format(approvedTotal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-warning">{BRL.format(pendingTotal)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground">
          O back-end atual não expõe uma lista global de pagamentos. Esta tela monta a visão administrativa consultando
          {" "}
          <code>GET /api/payments/order/{"{orderId}"}</code> para os pedidos retornados por cliente.
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(220px,1fr)_180px_auto]">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Buscar por pagamento, pedido, cliente ou gateway"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              {Object.entries(paymentStatusUi).map(([status, ui]) => (
                <SelectItem key={status} value={status}>
                  {ui.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => paymentsQuery.refetch()} disabled={paymentsQuery.isFetching}>
            {paymentsQuery.isFetching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Atualizar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {paymentsQuery.isLoading ? (
            <LoadingState message="Carregando pagamentos..." />
          ) : paymentsQuery.isError ? (
            <ErrorState onRetry={() => paymentsQuery.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState title="Nenhum pagamento encontrado" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader label="Pagamento" sortKey="id" current={table.sort} onToggle={() => table.toggleSort("id")} />
                    <SortableHeader label="Pedido" sortKey="orderId" current={table.sort} onToggle={() => table.toggleSort("orderId")} />
                    <SortableHeader label="Cliente" sortKey="customerName" current={table.sort} onToggle={() => table.toggleSort("customerName")} />
                    <SortableHeader label="Metodo" sortKey="method" current={table.sort} onToggle={() => table.toggleSort("method")} />
                    <SortableHeader label="Data" sortKey="createdAt" current={table.sort} onToggle={() => table.toggleSort("createdAt")} />
                    <SortableHeader label="Status" sortKey="status" current={table.sort} onToggle={() => table.toggleSort("status")} className="text-center" />
                    <SortableHeader label="Valor" sortKey="amount" current={table.sort} onToggle={() => table.toggleSort("amount")} className="text-right" />
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.pageData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs">{row.id}</TableCell>
                      <TableCell className="font-mono text-xs">{row.orderId}</TableCell>
                      <TableCell>{row.customerName}</TableCell>
                      <TableCell>{row.method}</TableCell>
                      <TableCell className="text-sm">{new Date(row.createdAt).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={paymentStatusUi[row.status].className}>
                          {paymentStatusUi[row.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{BRL.format(row.amount)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setSelected(row.record)}>
                          <Eye className="h-4 w-4 mr-1" /> Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                page={table.page}
                totalPages={table.totalPages}
                total={table.total}
                pageSize={table.pageSize}
                onChange={table.setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Pagamento {selected.payment.id}
                  <Badge variant="outline" className={paymentStatusUi[selected.payment.status].className}>
                    {paymentStatusUi[selected.payment.status].label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">Pedido</div>
                  <div className="font-mono">{selected.order.id}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Cliente</div>
                  <div>{selected.customer.name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Metodo</div>
                  <div>{selected.payment.method}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Valor</div>
                  <div className="font-medium">{BRL.format(selected.payment.amount)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Criado em</div>
                  <div>{new Date(selected.payment.createdAt).toLocaleString("pt-BR")}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Aprovado em</div>
                  <div>{selected.payment.approvedAt ? new Date(selected.payment.approvedAt).toLocaleString("pt-BR") : "Não aprovado"}</div>
                </div>
                {selected.payment.gatewayPaymentId && (
                  <div className="md:col-span-2">
                    <div className="text-xs text-muted-foreground">Gateway payment id</div>
                    <div className="font-mono text-xs">{selected.payment.gatewayPaymentId}</div>
                  </div>
                )}
                {selected.payment.statusDetail && (
                  <div className="md:col-span-2">
                    <div className="text-xs text-muted-foreground">Detalhe</div>
                    <div>{selected.payment.statusDetail}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
