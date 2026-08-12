import { useMemo, useState } from "react";
import { Ban, Eye, Loader2, Package, Search } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  useAdminOrders,
  useCancelAdminOrder,
  useUpdateAdminOrderStatus,
} from "@/features/admin/application/useAdminOperations";
import type { AdminOrderRecord } from "@/features/admin/domain/admin";
import type { OrderStatus } from "@/features/orders/domain/order";
import { orderStatusUi } from "@/features/orders/presentation/orderStatusUi";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/AsyncState";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type StatusFilter = "ALL" | OrderStatus;

interface OrderRow {
  id: string;
  customerName: string;
  customerCpf: string;
  createdAt: string;
  itemCount: number;
  total: number;
  status: OrderStatus;
  record: AdminOrderRecord;
}

function nextStatuses(status: OrderStatus): OrderStatus[] {
  switch (status) {
    case "PENDING_PAYMENT":
      return ["PAID"];
    case "PAID":
      return ["SHIPPED", "DELIVERED"];
    case "SHIPPED":
      return ["DELIVERED"];
    default:
      return [];
  }
}

function canCancel(status: OrderStatus) {
  return status === "PENDING_PAYMENT" || status === "PAID";
}

export default function AdminPedidos() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selected, setSelected] = useState<AdminOrderRecord | null>(null);
  const [canceling, setCanceling] = useState<AdminOrderRecord | null>(null);

  const ordersQuery = useAdminOrders({
    search,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });
  const updateStatus = useUpdateAdminOrderStatus();
  const cancelOrder = useCancelAdminOrder();

  const rows = useMemo<OrderRow[]>(() => {
    return (ordersQuery.data ?? []).map((record) => ({
      id: record.order.id,
      customerName: record.customer.name,
      customerCpf: record.customer.cpf ?? "",
      createdAt: record.order.createdAt,
      itemCount: record.order.items.length,
      total: record.order.total,
      status: record.order.status,
      record,
    }));
  }, [ordersQuery.data]);

  const table = useTableState<OrderRow>(rows, {
    initialSort: { key: "createdAt", dir: "desc" },
    pageSize: 10,
  });

  async function changeStatus(record: AdminOrderRecord, status: OrderStatus) {
    try {
      if (status === "CANCELED") {
        await cancelOrder.mutateAsync(record.order.id);
        toast.success(`Pedido ${record.order.id} cancelado`);
      } else {
        await updateStatus.mutateAsync({ orderId: record.order.id, status });
        toast.success(`Pedido ${record.order.id} atualizado`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao alterar pedido");
    }
  }

  async function confirmCancel() {
    if (!canceling) return;
    await changeStatus(canceling, "CANCELED");
    setCanceling(null);
  }

  const busy = updateStatus.isPending || cancelOrder.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6" /> Pedidos
          </h1>
          <p className="text-sm text-muted-foreground">Gerencie pedidos reais do back-end</p>
        </div>
        <Badge variant="secondary" className="bg-accent text-accent-foreground">
          {rows.length} pedido(s)
        </Badge>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(220px,1fr)_220px_auto]">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Buscar por pedido, cliente, CPF ou produto"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              {Object.entries(orderStatusUi).map(([status, ui]) => (
                <SelectItem key={status} value={status}>
                  {ui.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => ordersQuery.refetch()} disabled={ordersQuery.isFetching}>
            {ordersQuery.isFetching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Atualizar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {ordersQuery.isLoading ? (
            <LoadingState message="Carregando pedidos..." />
          ) : ordersQuery.isError ? (
            <ErrorState onRetry={() => ordersQuery.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState title="Nenhum pedido encontrado" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader label="Pedido" sortKey="id" current={table.sort} onToggle={() => table.toggleSort("id")} />
                    <SortableHeader label="Cliente" sortKey="customerName" current={table.sort} onToggle={() => table.toggleSort("customerName")} />
                    <SortableHeader label="Data" sortKey="createdAt" current={table.sort} onToggle={() => table.toggleSort("createdAt")} />
                    <SortableHeader label="Itens" sortKey="itemCount" current={table.sort} onToggle={() => table.toggleSort("itemCount")} className="text-center" />
                    <SortableHeader label="Total" sortKey="total" current={table.sort} onToggle={() => table.toggleSort("total")} className="text-right" />
                    <SortableHeader label="Status" sortKey="status" current={table.sort} onToggle={() => table.toggleSort("status")} className="text-center" />
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.pageData.map((row) => {
                    const ui = orderStatusUi[row.status];
                    const transitions = nextStatuses(row.status);
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-xs">{row.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{row.customerName}</div>
                          <div className="text-xs text-muted-foreground">{row.customerCpf}</div>
                        </TableCell>
                        <TableCell className="text-sm">{new Date(row.createdAt).toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-center">{row.itemCount}</TableCell>
                        <TableCell className="text-right font-medium">{BRL.format(row.total)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={ui.className}>{ui.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setSelected(row.record)}>
                              <Eye className="h-4 w-4 mr-1" /> Detalhes
                            </Button>
                            {transitions.length > 0 && (
                              <Select
                                value="NEXT"
                                disabled={busy}
                                onValueChange={(value) => changeStatus(row.record, value as OrderStatus)}
                              >
                                <SelectTrigger className="h-9 w-[150px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="NEXT" disabled>
                                    Mudar status
                                  </SelectItem>
                                  {transitions.map((status) => (
                                    <SelectItem key={status} value={status}>
                                      {orderStatusUi[status].label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {canCancel(row.status) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setCanceling(row.record)}
                                disabled={busy}
                              >
                                <Ban className="h-4 w-4 mr-1" /> Cancelar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
        <DialogContent className="max-w-3xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Pedido {selected.order.id}
                  <Badge variant="outline" className={orderStatusUi[selected.order.status].className}>
                    {orderStatusUi[selected.order.status].label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Cliente</div>
                    <div className="font-medium">{selected.customer.name}</div>
                    <div className="text-xs text-muted-foreground">{selected.customer.cpf}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Entrega</div>
                    <div>{selected.order.shippingAddress.street}, {selected.order.shippingAddress.number}</div>
                    <div className="text-xs text-muted-foreground">
                      {selected.order.shippingAddress.city}/{selected.order.shippingAddress.state} - CEP {selected.order.shippingAddress.zipCode}
                    </div>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.order.items.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{BRL.format(item.price * item.quantity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-between border-t pt-3 text-base font-semibold">
                  <span>Total</span>
                  <span>{BRL.format(selected.order.total)}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!canceling} onOpenChange={(open) => !open && setCanceling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar pedido {canceling?.order.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              O cancelamento chama o endpoint real do back-end e respeita as regras de estoque, pagamento e reembolso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
