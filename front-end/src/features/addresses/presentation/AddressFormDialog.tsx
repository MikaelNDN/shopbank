import { useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Address, AddressInput } from "../domain/address";
import { useCreateAddress, useLookupPostalCode, useUpdateAddress } from "../application/useAddresses";
import { maskZipCode } from "@/lib/masks";

const addressSchema = z.object({
  label: z.string().trim().min(1, "Informe um rótulo").max(40),
  recipientName: z.string().trim().min(2, "Informe o nome do recebedor").max(80),
  zipCode: z.string().refine((value) => onlyDigits(value).length === 8, "CEP inválido"),
  street: z.string().trim().min(2, "Informe a rua").max(120),
  number: z.string().trim().min(1, "Informe o número").max(20),
  complement: z.string().max(60).optional().or(z.literal("")),
  neighborhood: z.string().trim().min(2, "Informe o bairro").max(80),
  city: z.string().trim().min(2, "Informe a cidade").max(80),
  state: z.string().trim().length(2, "UF inválida"),
  reference: z.string().max(120).optional().or(z.literal("")),
  isFavorite: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: string;
  recipientName?: string;
  initial?: Address | null;
  defaultFavorite?: boolean;
  onSaved?: (address: Address) => void;
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}



function emptyValues(recipientName = "Cliente", defaultFavorite = false): AddressFormValues {
  return {
    label: "Casa",
    recipientName,
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    reference: "",
    isFavorite: defaultFavorite,
  };
}

function toFormValues(
  address: Address | null | undefined,
  recipientName?: string,
  defaultFavorite = false,
): AddressFormValues {
  if (!address) return emptyValues(recipientName, defaultFavorite);

  return {
    label: address.label,
    recipientName: address.recipientName ?? recipientName ?? "Cliente",
    zipCode: maskZipCode(address.zipCode),
    street: address.street,
    number: address.number,
    complement: address.complement ?? "",
    neighborhood: address.neighborhood,
    city: address.city,
    state: address.state,
    reference: address.reference ?? "",
    isFavorite: address.isFavorite,
  };
}

function toAddressInput(values: AddressFormValues): AddressInput {
  return {
    label: values.label.trim(),
    recipientName: values.recipientName.trim(),
    zipCode: onlyDigits(values.zipCode),
    street: values.street.trim(),
    number: values.number.trim(),
    complement: values.complement?.trim() || undefined,
    neighborhood: values.neighborhood.trim(),
    city: values.city.trim(),
    state: values.state.trim().toUpperCase(),
    reference: values.reference?.trim() || undefined,
    isFavorite: values.isFavorite,
  };
}

export function AddressFormDialog({
  open,
  onOpenChange,
  customerId,
  recipientName,
  initial,
  defaultFavorite = false,
  onSaved,
}: AddressFormDialogProps) {
  const createAddress = useCreateAddress(customerId);
  const updateAddress = useUpdateAddress(customerId);
  const lookupPostalCode = useLookupPostalCode();
  const lastLookupRef = useRef("");

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: toFormValues(initial, recipientName, defaultFavorite),
  });

  useEffect(() => {
    if (!open) return;
    lastLookupRef.current = "";
    form.reset(toFormValues(initial, recipientName, defaultFavorite));
  }, [defaultFavorite, form, initial, open, recipientName]);

  async function lookupZipCode(value: string, silent = true) {
    const clean = onlyDigits(value);
    if (clean.length !== 8) {
      if (!silent) toast.error("CEP deve ter 8 digitos");
      return;
    }
    if (silent && lastLookupRef.current === clean) return;
    lastLookupRef.current = clean;

    try {
      const data = await lookupPostalCode.mutateAsync(clean);
      if (!data) {
        if (!silent) toast.error("CEP não encontrado");
        return;
      }
      form.setValue("zipCode", maskZipCode(data.zipCode), { shouldValidate: true });
      form.setValue("street", data.street ?? "", { shouldValidate: true });
      form.setValue("neighborhood", data.neighborhood ?? "", { shouldValidate: true });
      form.setValue("city", data.city ?? "", { shouldValidate: true });
      form.setValue("state", data.state ?? "", { shouldValidate: true });
      if (data.complement) form.setValue("complement", data.complement, { shouldValidate: true });
      if (!silent) toast.success("Endereco encontrado pelo CEP");
      setTimeout(() => document.getElementById("address-number-input")?.focus(), 50);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao buscar CEP";
      form.setError("zipCode", { message });
      toast.error(message);
    }
  }

  async function onSubmit(values: AddressFormValues) {
    const input = toAddressInput(values);
    try {
      const saved = initial
        ? await updateAddress.mutateAsync({ addressId: initial.id, input })
        : await createAddress.mutateAsync(input);
      toast.success(initial ? "Endereco atualizado" : "Endereco adicionado");
      onSaved?.(saved);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar endereco");
    }
  }

  const saving = createAddress.isPending || updateAddress.isPending;
  const lookupLoading = lookupPostalCode.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar endereço" : "Novo endereço"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rotulo</FormLabel>
                    <FormControl>
                      <Input placeholder="Casa, Trabalho..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recipientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recebedor</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="00000-000"
                        value={field.value}
                        name={field.name}
                        onBlur={field.onBlur}
                        maxLength={9}
                        onChange={(event) => {
                          const formatted = maskZipCode(event.target.value);
                          field.onChange(formatted);
                          form.clearErrors("zipCode");
                          if (onlyDigits(formatted).length === 8) lookupZipCode(formatted);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => lookupZipCode(form.getValues("zipCode"), false)}
                disabled={lookupLoading}
              >
                {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Buscar</span>
              </Button>
            </div>

            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rua</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero</FormLabel>
                    <FormControl>
                      <Input id="address-number-input" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="complement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input placeholder="Apto, bloco" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF</FormLabel>
                    <FormControl>
                      <Input
                        maxLength={2}
                        {...field}
                        onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ponto de referencia</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Proximo ao mercado..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isFavorite"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-md border px-4 py-3">
                  <div>
                    <FormLabel>Definir como favorito</FormLabel>
                    <p className="text-xs text-muted-foreground">Pre-selecionado no checkout.</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {initial ? "Salvar alteracoes" : "Adicionar endereco"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
