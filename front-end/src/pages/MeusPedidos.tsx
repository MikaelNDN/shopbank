import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMyOrders } from "@/features/orders/application/useOrders";
import type { OrderStatus } from "@/features/orders/domain/order";
import { OrderStatusBadge } from "@/features/orders/presentation/orderStatus";
import { orderStatusUi } from "@/features/orders/presentation/orderStatusUi";
import { EmptyState, ErrorState, LoadingState } from "@/shared/ui/AsyncState";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type StatusFilter = "ALL" | OrderStatus;

export default function MeusPedidos() {
  const ordersQuery = useMyOrders();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const filteredOrders = useMemo(() => {
    if (statusFilter === "ALL") return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6" /> Meus Pedidos
          </h1>
          <p className="text-sm text-muted-foreground">Acompanhe o status dos seus pedidos</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-accent text-accent-foreground">
            {filteredOrders.length} pedido(s)
          </Badge>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger className="w-[210px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              {(Object.keys(orderStatusUi) as OrderStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  {orderStatusUi[status].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {ordersQuery.isLoading ? (
        <Card>
          <CardContent>
            <LoadingState message="Carregando pedidos..." />
          </CardContent>
        </Card>
      ) : ordersQuery.isError ? (
        <Card>
          <CardContent>
            <ErrorState onRetry={() => ordersQuery.refetch()} />
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="Você ainda não tem pedidos"
              description="Os pedidos criados no checkout aparecem aqui apos a API confirmar a criacao."
              action={
                <Button asChild>
                  <Link to="/produtos">Ver produtos</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState title="Nenhum pedido neste status" description="Altere o filtro para ver outros pedidos." />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-center">Itens</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.id}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(order.createdAt).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-center">{order.items.length}</TableCell>
                    <TableCell className="text-right font-medium">{BRL.format(order.total)}</TableCell>
                    <TableCell className="text-center">
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link to={`/meus-pedidos/${order.id}`}>
                          <Eye className="h-4 w-4 mr-1" /> Detalhes
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
