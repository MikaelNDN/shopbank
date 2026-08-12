import { useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Loader2, MapPin, Package } from "lucide-react";
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
import { useAuth } from "@/context/AuthContext";
import { useAddresses } from "@/features/addresses/application/useAddresses";
import { CatalogHttpRepository } from "@/features/catalog/infrastructure/catalogHttpRepository";
import { useCreateOrder } from "@/features/orders/application/useOrders";
import { useCartStore } from "@/store/cart";
import { maskZipCode } from "@/lib/masks";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function CheckoutPedido() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const customerId = user?.customerId ?? user?.id;
  const {
    itens,
    selectedAddressId,
    pedidoId,
    subtotal,
    total,
    setPedidoId,
  } = useCartStore();
  const addressesQuery = useAddresses(customerId);
  const createOrder = useCreateOrder();

  const addresses = useMemo(() => addressesQuery.data ?? [], [addressesQuery.data]);
  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  if (itens.length === 0) return <Navigate to="/carrinho" replace />;
  if (!selectedAddressId) return <Navigate to="/checkout/endereco" replace />;

  async function validateCartStock() {
    const products = await Promise.all(
      itens.map(async (item) => ({
        item,
        product: await CatalogHttpRepository.getProduct(item.productId),
      })),
    );

    for (const { item, product } of products) {
      if (!product || !product.active) {
        throw new Error(`Produto "${item.name}" não está mais disponível.`);
      }
      if (product.availableQuantity < item.quantity) {
        throw new Error(
          `Estoque insuficiente para "${product.name}" (disponivel: ${product.availableQuantity}).`,
        );
      }
    }
  }

  async function criarPedido() {
    if (!customerId) {
      toast.error("Sessão inválida. Entre novamente para criar o pedido.");
      return;
    }
    if (!selectedAddress) {
      toast.error("Selecione um endereco de entrega.");
      navigate("/checkout/endereco");
      return;
    }
    if (pedidoId) {
      navigate("/checkout/pagamento");
      return;
    }

    try {
      await validateCartStock();
      const order = await createOrder.mutateAsync({
        customerId,
        customerAddressId: selectedAddress.id,
        items: itens.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
      setPedidoId(order.id);
      toast.success(`Pedido ${order.id} criado`);
      navigate("/checkout/pagamento");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao criar pedido");
    }
  }

  if (addressesQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-16 flex items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Carregando checkout...
        </CardContent>
      </Card>
    );
  }

  if (addressesQuery.isError || !selectedAddress) {
    return <Navigate to="/checkout/endereco" replace />;
  }

  const creating = createOrder.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Package className="h-6 w-6" /> Confirmar pedido
        </h1>
        <p className="text-sm text-muted-foreground">Revise o resumo antes de criar o pedido</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div>
                {selectedAddress.street}, {selectedAddress.number}
                {selectedAddress.complement ? ` - ${selectedAddress.complement}` : ""}
              </div>
              <div>
                {selectedAddress.neighborhood} - {selectedAddress.city}/{selectedAddress.state}
              </div>
              <div className="text-muted-foreground">CEP {maskZipCode(selectedAddress.zipCode)}</div>
              <Button variant="link" className="px-0 h-auto" onClick={() => navigate("/checkout/endereco")}>
                Alterar endereco
              </Button>
            </CardContent>
          </Card>

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
                  {itens.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{BRL.format(item.price)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {BRL.format(item.price * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{BRL.format(subtotal())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frete</span>
              <span>{BRL.format(0)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-semibold text-base">
              <span>Total</span>
              <span>{BRL.format(total())}</span>
            </div>
            {pedidoId ? (
              <Badge variant="outline" className="w-full justify-center gap-1 mt-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Pedido {pedidoId} criado
              </Badge>
            ) : (
              <Badge variant="outline" className="w-full justify-center mt-2">
                Estoque validado ao confirmar
              </Badge>
            )}
            <Button className="w-full" disabled={creating} onClick={criarPedido}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {pedidoId ? "Ir para pagamento" : "Criar pedido"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
