import { useMemo, useState } from "react";
import { Eye, Loader2, Search, Users } from "lucide-react";
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
import { useAdminCustomer, useAdminCustomers } from "@/features/admin/application/useAdminOperations";
import type { CustomerSummary } from "@/features/admin/domain/admin";
import { orderStatusUi } from "@/features/orders/presentation/orderStatusUi";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/AsyncState";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

interface CustomerRow {
  id: string;
  name: string;
  cpf: string;
  totalOrders: number;
  totalSpent: number;
  averageTicket: number;
  lastOrderAt: string;
  summary: CustomerSummary;
}

export default function AdminClientes() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const customersQuery = useAdminCustomers(search);
  const customerQuery = useAdminCustomer(selectedId ?? undefined);

  const rows = useMemo<CustomerRow[]>(() => {
    return (customersQuery.data ?? []).map((summary) => ({
      id: summary.user.customerId ?? summary.user.id,
      name: summary.user.name,
      cpf: summary.user.cpf ?? "",
      totalOrders: summary.totalOrders,
      totalSpent: summary.totalSpent,
      averageTicket: summary.averageTicket,
      lastOrderAt: summary.lastOrderAt ?? "",
      summary,
    }));
  }, [customersQuery.data]);

  const table = useTableState<CustomerRow>(rows, {
    initialSort: { key: "lastOrderAt", dir: "desc" },
    pageSize: 10,
  });

  const selectedCustomer = customerQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" /> Clientes
          </h1>
          <p className="text-sm text-muted-foreground">Lista de clientes, pedidos e valor gasto</p>
        </div>
        <Badge variant="secondary" className="bg-accent text-accent-foreground">
          {rows.length} cliente(s)
        </Badge>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(220px,1fr)_auto]">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Buscar por nome ou CPF"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => customersQuery.refetch()} disabled={customersQuery.isFetching}>
            {customersQuery.isFetching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Atualizar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {customersQuery.isLoading ? (
            <LoadingState message="Carregando clientes..." />
          ) : customersQuery.isError ? (
            <ErrorState onRetry={() => customersQuery.refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState title="Nenhum cliente encontrado" />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader label="Cliente" sortKey="name" current={table.sort} onToggle={() => table.toggleSort("name")} />
                    <SortableHeader label="CPF" sortKey="cpf" current={table.sort} onToggle={() => table.toggleSort("cpf")} />
                    <SortableHeader label="Pedidos" sortKey="totalOrders" current={table.sort} onToggle={() => table.toggleSort("totalOrders")} className="text-center" />
                    <SortableHeader label="Valor gasto" sortKey="totalSpent" current={table.sort} onToggle={() => table.toggleSort("totalSpent")} className="text-right" />
                    <SortableHeader label="Ticket medio" sortKey="averageTicket" current={table.sort} onToggle={() => table.toggleSort("averageTicket")} className="text-right" />
                    <SortableHeader label="Ultimo pedido" sortKey="lastOrderAt" current={table.sort} onToggle={() => table.toggleSort("lastOrderAt")} />
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.pageData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="font-mono text-xs">{row.cpf}</TableCell>
                      <TableCell className="text-center">{row.totalOrders}</TableCell>
                      <TableCell className="text-right font-medium">{BRL.format(row.totalSpent)}</TableCell>
                      <TableCell className="text-right">{BRL.format(row.averageTicket)}</TableCell>
                      <TableCell className="text-sm">
                        {row.lastOrderAt ? new Date(row.lastOrderAt).toLocaleString("pt-BR") : "Sem pedidos"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedId(row.id)}>
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

      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhe do cliente</DialogTitle>
          </DialogHeader>
          {customerQuery.isLoading ? (
            <LoadingState message="Carregando detalhe..." />
          ) : customerQuery.isError ? (
            <ErrorState onRetry={() => customerQuery.refetch()} />
          ) : selectedCustomer ? (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 md:grid-cols-4">
                <Card className="shadow-none">
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">Cliente</div>
                    <div className="font-medium">{selectedCustomer.user.name}</div>
                    <div className="text-xs text-muted-foreground">{selectedCustomer.user.cpf}</div>
                  </CardContent>
                </Card>
                <Card className="shadow-none">
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">Pedidos</div>
                    <div className="text-xl font-semibold">{selectedCustomer.totalOrders}</div>
                  </CardContent>
                </Card>
                <Card className="shadow-none">
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">Valor gasto</div>
                    <div className="text-xl font-semibold">{BRL.format(selectedCustomer.totalSpent)}</div>
                  </CardContent>
                </Card>
                <Card className="shadow-none">
                  <CardContent className="p-3">
                    <div className="text-xs text-muted-foreground">Ticket medio</div>
                    <div className="text-xl font-semibold">{BRL.format(selectedCustomer.averageTicket)}</div>
                  </CardContent>
                </Card>
              </div>
              {selectedCustomer.orders.length === 0 ? (
                <EmptyState title="Cliente sem pedidos" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCustomer.orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-xs">{order.id}</TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleString("pt-BR")}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={orderStatusUi[order.status].className}>
                            {orderStatusUi[order.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{BRL.format(order.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          ) : (
            <EmptyState title="Cliente não encontrado" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
