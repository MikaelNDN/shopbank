import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { z } from 'zod';

import { Button, Input } from '@/components/common';
import { ImageUploader } from '@/components/admin/ImageUploader';
import type { Category, Product } from '@/types/product';
import { formatCurrency, parseCurrency } from '@/utils/formatCurrency';

const schema = z.object({
  name: z.string().min(3, 'Nome muito curto'),
  description: z.string().min(10, 'Descrição muito curta'),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  price: z
    .string()
    .min(1, 'Informe o preço')
    .refine((v) => parseCurrency(v) > 0, 'Preço inválido'),
  availableQuantity: z
    .string()
    .min(1, 'Informe a quantidade')
    .refine((v) => Number.parseInt(v, 10) >= 0, 'Quantidade inválida'),
  imageUrl: z.string().min(1, 'Selecione uma imagem'),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export interface ProductFormSubmit {
  name: string;
  description: string;
  categoryId: string;
  price: number;
  availableQuantity: number;
  imageUrl: string;
  active: boolean;
}

interface ProductFormProps {
  initial?: Product;
  categories: Category[];
  submitLabel: string;
  onSubmit: (values: ProductFormSubmit) => Promise<void>;
}

export function ProductForm({
  initial,
  categories,
  submitLabel,
  onSubmit,
}: ProductFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      description: initial?.description ?? '',
      categoryId: initial?.categoryId ?? '',
      price: initial ? formatCurrency(initial.price) : '',
      availableQuantity: initial
        ? String(initial.availableQuantity)
        : '0',
      imageUrl: initial?.imageUrl ?? '',
      active: initial?.active ?? true,
    },
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      name: values.name,
      description: values.description,
      categoryId: values.categoryId,
      price: parseCurrency(values.price),
      availableQuantity: Number.parseInt(values.availableQuantity, 10) || 0,
      imageUrl: values.imageUrl,
      active: values.active,
    });
  });

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="imageUrl"
        render={({ field: { value, onChange } }) => (
          <View>
            <Text className="mb-2 text-sm font-medium text-gray-800">
              Imagem do produto
            </Text>
            <ImageUploader uri={value} onChange={onChange} />
            {errors.imageUrl ? (
              <Text className="mt-1 text-xs text-danger">
                {errors.imageUrl.message}
              </Text>
            ) : null}
          </View>
        )}
      />

      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Nome"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            label="Descrição"
            multiline
            numberOfLines={4}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.description?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="categoryId"
        render={({ field: { value, onChange } }) => (
          <View>
            <Text className="mb-2 text-sm font-medium text-gray-800">
              Categoria
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {categories.map((cat) => {
                const selected = value === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => onChange(cat.id)}
                    className={`rounded-full border px-4 py-2 ${
                      selected
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-border bg-white'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selected ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            {errors.categoryId ? (
              <Text className="mt-1 text-xs text-danger">
                {errors.categoryId.message}
              </Text>
            ) : null}
          </View>
        )}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Controller
            control={control}
            name="price"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Preço"
                placeholder="R$ 0,00"
                keyboardType="decimal-pad"
                value={value}
                onChangeText={onChange}
                onBlur={() => {
                  const parsed = parseCurrency(value);
                  if (parsed > 0) {
                    onChange(formatCurrency(parsed));
                  }
                  onBlur();
                }}
                error={errors.price?.message}
              />
            )}
          />
        </View>
        <View className="flex-1">
          <Controller
            control={control}
            name="availableQuantity"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                label="Quantidade"
                keyboardType="number-pad"
                value={value}
                onChangeText={(t) => onChange(t.replace(/\D/g, ''))}
                onBlur={onBlur}
                error={errors.availableQuantity?.message}
              />
            )}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="active"
        render={({ field: { value, onChange } }) => (
          <View className="flex-row items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
            <View className="flex-1 pr-4">
              <Text className="text-sm font-semibold text-gray-900">
                Produto ativo
              </Text>
              <Text className="text-xs text-muted">
                Aparece para os clientes na loja.
              </Text>
            </View>
            <Switch value={value} onValueChange={onChange} />
          </View>
        )}
      />

      <Button
        label={submitLabel}
        size="lg"
        fullWidth
        loading={isSubmitting}
        onPress={submit}
      />
    </View>
  );
}
