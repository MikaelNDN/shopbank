import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, Home as HomeIcon, Loader2, MapPin, Plus, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/context/AuthContext";
import { useAddresses } from "@/features/addresses/application/useAddresses";
import type { Address } from "@/features/addresses/domain/address";
import { AddressFormDialog } from "@/features/addresses/presentation/AddressFormDialog";
import { cn } from "@/lib/utils";
import { maskZipCode } from "@/lib/masks";
import { useCartStore } from "@/store/cart";


function AddressOption({ address, selected }: { address: Address; selected: boolean }) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-md border p-4 transition-colors",
        selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
      )}
    >
      <RadioGroupItem value={address.id} id={`address-${address.id}`} className="mt-1" />
      <label htmlFor={`address-${address.id}`} className="flex-1 cursor-pointer space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 font-medium">
            <HomeIcon className="h-4 w-4 text-primary" />
            {address.label}
          </div>
          {address.isFavorite && (
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3" /> Favorito
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground space-y-0.5">
          <div>
            {address.street}, {address.number}
            {address.complement ? ` - ${address.complement}` : ""}
          </div>
          <div>
            {address.neighborhood} - {address.city}/{address.state}
          </div>
          <div>CEP {maskZipCode(address.zipCode)}</div>
        </div>
      </label>
    </div>
  );
}

export default function CheckoutEndereco() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const customerId = user?.customerId ?? user?.id;
  const { itens, selectedAddressId, setSelectedAddressId } = useCartStore();
  const addressesQuery = useAddresses(customerId);
  const [formOpen, setFormOpen] = useState(false);

  const addresses = useMemo(() => addressesQuery.data ?? [], [addressesQuery.data]);
  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  );

  useEffect(() => {
    if (addresses.length === 0) return;
    if (selectedAddressId && addresses.some((address) => address.id === selectedAddressId)) return;

    const defaultAddress = addresses.find((address) => address.isFavorite) ?? addresses[0];
    setSelectedAddressId(defaultAddress.id);
  }, [addresses, selectedAddressId, setSelectedAddressId]);

  if (itens.length === 0) return <Navigate to="/carrinho" replace />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <MapPin className="h-6 w-6" /> Endereco de entrega
          </h1>
          <p className="text-sm text-muted-foreground">Selecione onde deseja receber o pedido</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo endereco
        </Button>
      </div>

      {!customerId ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Sessão inválida. Entre novamente para selecionar um endereço.
          </CardContent>
        </Card>
      ) : addressesQuery.isLoading ? (
        <Card>
          <CardContent className="py-12 flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Carregando enderecos...
          </CardContent>
        </Card>
      ) : addressesQuery.isError ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Não foi possível carregar seus endereços.
          </CardContent>
        </Card>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-accent flex items-center justify-center">
              <MapPin className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Nenhum endereco cadastrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Cadastre um endereco para continuar o checkout.
              </p>
            </div>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Cadastrar endereco
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enderecos salvos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={selectedAddress?.id ?? ""} onValueChange={setSelectedAddressId}>
              {addresses.map((address) => (
                <AddressOption key={address.id} address={address} selected={address.id === selectedAddress?.id} />
              ))}
            </RadioGroup>

            <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={() => navigate("/carrinho")}>
                Voltar ao carrinho
              </Button>
              <Button
                disabled={!selectedAddress}
                onClick={() => navigate("/checkout/pedido")}
                className="sm:min-w-48"
              >
                Continuar <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <AddressFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customerId={customerId}
        recipientName={user?.nome}
        defaultFavorite={addresses.length === 0}
        onSaved={(address) => setSelectedAddressId(address.id)}
      />
    </div>
  );
}
