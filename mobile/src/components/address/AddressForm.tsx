import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import {
  Controller,
  useForm,
  type UseFormReturn,
} from 'react-hook-form';
import {
  ActivityIndicator,
  Switch,
  Text,
  View,
} from 'react-native';
import { z } from 'zod';

import { addressApi } from '@/api/addressApi';
import { Button, Input } from '@/components/common';
import type { Address } from '@/types/address';
import { formatZipCode, unformatZipCode } from '@/utils/formatZipCode';

const schema = z.object({
  label: z.string().min(1, 'Informe um rótulo'),
  zipCode: z
    .string()
    .refine((v) => unformatZipCode(v).length === 8, 'CEP inválido'),
  street: z.string().min(1, 'Informe a rua'),
  number: z.string().min(1, 'Informe o número'),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, 'Informe o bairro'),
  city: z.string().min(1, 'Informe a cidade'),
  state: z.string().length(2, 'UF inválida'),
  isFavorite: z.boolean().optional(),
});

export type AddressFormValues = z.infer<typeof schema>;

interface AddressFormProps {
  initial?: Address;
  submitLabel: string;
  onSubmit: (values: AddressFormValues) => Promise<void>;
}

export function AddressForm({
  initial,
  submitLabel,
  onSubmit,
}: AddressFormProps) {
  const form: UseFormReturn<AddressFormValues> = useForm<AddressFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: initial?.label ?? 'Casa',
      zipCode: initial ? formatZipCode(initial.zipCode) : '',
      street: initial?.street ?? '',
      number: initial?.number ?? '',
      complement: initial?.complement ?? '',
      neighborhood: initial?.neighborhood ?? '',
      city: initial?.city ?? '',
      state: initial?.state ?? '',
      isFavorite: initial?.isFavorite ?? false,
    },
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const [cepLoading, setCepLoading] = useState(false);
  const lookupRef = useRef<string>('');
  const zip = watch('zipCode');

  useEffect(() => {
    const cleaned = unformatZipCode(zip);
    if (cleaned.length !== 8 || cleaned === lookupRef.current) return;
    lookupRef.current = cleaned;
    let cancelled = false;
    setCepLoading(true);
    addressApi
      .lookupByZipCode(cleaned)
      .then((data) => {
        if (cancelled || !data) return;
        if (data.logradouro) setValue('street', data.logradouro);
        if (data.bairro) setValue('neighborhood', data.bairro);
        if (data.localidade) setValue('city', data.localidade);
        if (data.uf) setValue('state', data.uf);
      })
      .finally(() => {
        if (!cancelled) setCepLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [zip, setValue]);

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="label"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Rótulo"
            placeholder="Casa, Trabalho..."
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.label?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="zipCode"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="CEP"
            placeholder="00000-000"
            keyboardType="number-pad"
            maxLength={9}
            value={value}
            onChangeText={(t) => onChange(formatZipCode(t))}
            onBlur={onBlur}
            error={errors.zipCode?.message}
            rightSlot={
              cepLoading ? (
                <ActivityIndicator size="small" color="#ed751e" />
              ) : undefined
            }
          />
        )}
      />

      <Controller
        control={control}
        name="street"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Rua"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.street?.message}
          />
        )}
      />

      <View className="flex-row gap-3">
        <View className="w-32">
          <Controller
            control={control}
            name="number"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Número"
                keyboardType="default"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.number?.message}
              />
            )}
          />
        </View>
        <View className="flex-1">
          <Controller
            control={control}
            name="complement"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Complemento"
                placeholder="Apto, casa..."
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="neighborhood"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Bairro"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.neighborhood?.message}
          />
        )}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={control}
            name="city"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Cidade"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.city?.message}
              />
            )}
          />
        </View>
        <View className="w-24">
          <Controller
            control={control}
            name="state"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="UF"
                maxLength={2}
                autoCapitalize="characters"
                value={value}
                onChangeText={(t) => onChange(t.toUpperCase())}
                onBlur={onBlur}
                error={errors.state?.message}
              />
            )}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="isFavorite"
        render={({ field: { value, onChange } }) => (
          <View className="flex-row items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
            <View className="flex-1 pr-4">
              <Text className="text-sm font-semibold text-gray-900">
                Definir como favorito
              </Text>
              <Text className="text-xs text-muted">
                Será pré-selecionado no checkout.
              </Text>
            </View>
            <Switch value={!!value} onValueChange={onChange} />
          </View>
        )}
      />

      <Button
        label={submitLabel}
        size="lg"
        fullWidth
        loading={isSubmitting}
        onPress={handleSubmit(onSubmit)}
      />
    </View>
  );
}
