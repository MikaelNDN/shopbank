import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, Loader2, MapPin, Package, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { useCancelOrder, useOrder } from "@/features/orders/application/useOrders";
import { OrderStatusBadge } from "@/features/orders/presentation/orderStatus";
import { usePaymentByOrder } from "@/features/payments/application/usePayments";
import { ErrorState, LoadingState } from "@/shared/ui/AsyncState";
import { maskZipCode } from "@/lib/masks";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function paymentStatusLabel(status?: string): string {
  switch (status) {
    case "APPROVED":
      return "Aprovado";
    case "REJECTED":
      return "Rejeitado";
    case "REFUNDED":
      return "Estornado";
    case "PENDING":
      return "Pendente";
    default:
      return "Sem pagamento";
  }
}

export default function PedidoDetalhes() {
  const { id } = useParams<{ id: string }>();
  const orderQuery = useOrder(id);
  const paymentQuery = usePaymentByOrder(id);
  const cancelOrder = useCancelOrder();

  if (!id) return <Navigate to="/meus-pedidos" replace />;

  async function handleCancel() {
    try {
      await cancelOrder.mutateAsync(id!);
      toast.success("Pedido cancelado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao cancelar pedido");
    }
  }

  if (orderQuery.isLoading) {
    return (
      <Card>
        <CardContent>
          <LoadingState message="Carregando pedido..." />
        </CardContent>
      </Card>
    );
  }

  if (orderQuery.isError) {
    return (
      <Card>
        <CardContent>
          <ErrorState onRetry={() => orderQuery.refetch()} />
        </CardContent>
      </Card>
    );
  }

  if (!orderQuery.data) return <Navigate to="/meus-pedidos" replace />;

  const order = orderQuery.data;
  const payment = paymentQuery.data;
  const canCancel = order.status === "PENDING_PAYMENT";
  const address = order.shippingAddress;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild size="icon" variant="ghost">
          <Link to="/meus-pedidos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6" /> Pedido {order.id}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <XCircle className="h-4 w-4 mr-2" /> Cancelar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar pedido {order.id}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O cancelamento sera processado pelo back-end e o status do pedido sera atualizado.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={cancelOrder.isPending}
                  >
                    {cancelOrder.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Cancelar pedido
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <div className="text-foreground">
              {address.street}, {address.number}
              {address.complement ? ` - ${address.complement}` : ""}
            </div>
            <div>
              {address.neighborhood} - {address.city}/{address.state}
            </div>
            <div>CEP {maskZipCode(address.zipCode)}</div>
            {address.recipientName && <div>Recebedor: {address.recipientName}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Metodo</span>
              <span>{payment?.method ?? order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline">{paymentStatusLabel(payment?.status)}</Badge>
            </div>
            {payment?.gatewayPaymentId && (
              <div className="text-xs text-muted-foreground">
                gateway_id: <code>{payment.gatewayPaymentId}</code>
              </div>
            )}
            {order.status === "PENDING_PAYMENT" && (
              <Button asChild className="w-full">
                <Link to={`/checkout/pagamento/${order.id}`}>Continuar pagamento</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Itens</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead className="text-right">Preco</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.productId}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{BRL.format(item.price)}</TableCell>
                  <TableCell className="text-right">{BRL.format(item.price * item.quantity)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{BRL.format(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Frete</span>
            <span>{BRL.format(order.shipping)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold text-base">
            <span>Total</span>
            <span>{BRL.format(order.total)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
