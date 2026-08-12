import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, Minus, PackageCheck, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCartStore } from "@/store/cart";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function Carrinho() {
  const navigate = useNavigate();
  const { itens, setQuantidade, remove, subtotal, total } = useCartStore();

  if (itens.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Carrinho</h1>
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Seu carrinho está vazio.</p>
            <Button asChild>
              <Link to="/produtos">Ver produtos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Carrinho</h1>
          <p className="text-sm text-muted-foreground">Revise os itens antes do checkout</p>
        </div>
        <Badge variant="secondary" className="bg-accent text-accent-foreground">
          {itens.length} item(ns)
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-center">Quantidade</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Estoque: {item.availableQuantity}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{BRL.format(item.price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => setQuantidade(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(event) => setQuantidade(item.productId, Number(event.target.value) || 1)}
                          className="h-7 w-14 text-center"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => setQuantidade(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.availableQuantity}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {BRL.format(item.price * item.quantity)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          remove(item.productId);
                          toast.success("Item removido");
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PackageCheck className="h-4 w-4" /> Resumo
            </CardTitle>
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
            <Button className="w-full mt-2" onClick={() => navigate("/checkout/endereco")}>
              Continuar <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
