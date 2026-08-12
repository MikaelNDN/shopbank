import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Home as HomeIcon, Loader2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
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
import { useAuth } from "@/context/AuthContext";
import {
  useAddresses,
  useDeleteAddress,
  useSetFavoriteAddress,
} from "@/features/addresses/application/useAddresses";
import type { Address } from "@/features/addresses/domain/address";
import { AddressFormDialog } from "@/features/addresses/presentation/AddressFormDialog";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { maskZipCode } from "@/lib/masks";

export default function MeusEnderecos() {
  const { user } = useAuth();
  const customerId = user?.customerId ?? user?.id;
  const selectedAddressId = useCartStore((state) => state.selectedAddressId);
  const setSelectedAddressId = useCartStore((state) => state.setSelectedAddressId);

  const addressesQuery = useAddresses(customerId);
  const deleteAddress = useDeleteAddress(customerId);
  const setFavoriteAddress = useSetFavoriteAddress(customerId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const addresses = useMemo(() => addressesQuery.data ?? [], [addressesQuery.data]);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(address: Address) {
    setEditing(address);
    setFormOpen(true);
  }

  async function favorite(addressId: string) {
    try {
      await setFavoriteAddress.mutateAsync(addressId);
      toast.success("Endereço favorito atualizado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao favoritar endereço");
    }
  }

  async function removeSelected() {
    if (!deletingId) return;

    try {
      await deleteAddress.mutateAsync(deletingId);
      if (selectedAddressId === deletingId) setSelectedAddressId(null);
      toast.success("Endereço removido");
      setDeletingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao remover endereço");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meus Endereços</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus locais de entrega</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar endereço
        </Button>
      </div>

      {!customerId ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Sessão inválida. Entre novamente para gerenciar endereços.
          </CardContent>
        </Card>
      ) : addressesQuery.isLoading ? (
        <Card>
          <CardContent className="py-16 flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Carregando endereços...
          </CardContent>
        </Card>
      ) : addressesQuery.isError ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
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
              <h3 className="font-medium">Nenhum endereço cadastrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione um endereço para agilizar suas próximas compras.
              </p>
            </div>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" /> Cadastrar primeiro endereço
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <Card
              key={address.id}
              className={cn(address.isFavorite && "border-primary/60 ring-1 ring-primary/20")}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                      <HomeIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{address.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {address.recipientName ?? user?.nome ?? "Cliente"}
                      </div>
                    </div>
                  </div>
                  {address.isFavorite && (
                    <Badge className="gap-1">
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
                  {address.reference && <div className="italic">Ref.: {address.reference}</div>}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {!address.isFavorite && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => favorite(address.id)}
                      disabled={setFavoriteAddress.isPending}
                    >
                      <Star className="h-3.5 w-3.5 mr-1.5" /> Tornar favorito
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => openEdit(address)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeletingId(address.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddressFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customerId={customerId}
        recipientName={user?.nome}
        initial={editing}
        defaultFavorite={addresses.length === 0}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover endereço?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={removeSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteAddress.isPending}
            >
              {deleteAddress.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
