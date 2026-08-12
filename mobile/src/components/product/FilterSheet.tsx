import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback, useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';

import { Button } from '@/components/common';
import { CategoryChip } from '@/components/product/CategoryChip';
import type { Category, ProductFilters } from '@/types/product';

export interface FilterSheetRef {
  present: () => void;
  dismiss: () => void;
}

interface FilterSheetProps {
  categories: Category[];
  initial: Pick<ProductFilters, 'categoryId' | 'inStockOnly'>;
  onApply: (next: Pick<ProductFilters, 'categoryId' | 'inStockOnly'>) => void;
}

export const FilterSheet = forwardRef<FilterSheetRef, FilterSheetProps>(
  function FilterSheet({ categories, initial, onApply }, ref) {
    const sheetRef = (ref as unknown as React.MutableRefObject<
      BottomSheetModal | null
    >) ?? null;

    const [categoryId, setCategoryId] = useState<string | undefined>(
      initial.categoryId,
    );
    const [inStockOnly, setInStockOnly] = useState<boolean>(
      initial.inStockOnly ?? false,
    );

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
        />
      ),
      [],
    );

    const apply = () => {
      onApply({ categoryId, inStockOnly });
      sheetRef?.current?.dismiss();
    };

    const reset = () => {
      setCategoryId(undefined);
      setInStockOnly(false);
    };

    return (
      <BottomSheetModal
        ref={ref as unknown as React.RefObject<BottomSheetModal>}
        snapPoints={['60%']}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: '#9ca3af' }}
      >
        <BottomSheetView style={{ flex: 1, padding: 24 }}>
          <Text className="text-xl font-bold text-gray-900">Filtros</Text>

          <Text className="mt-6 text-sm font-semibold text-gray-800">
            Categoria
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
          >
            <CategoryChip
              label="Todas"
              selected={!categoryId}
              onPress={() => setCategoryId(undefined)}
            />
            {categories.map((cat) => (
              <CategoryChip
                key={cat.id}
                label={cat.name}
                selected={categoryId === cat.id}
                onPress={() => setCategoryId(cat.id)}
              />
            ))}
          </ScrollView>

          <View className="mt-6 flex-row items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
            <View className="flex-1 pr-4">
              <Text className="text-sm font-semibold text-gray-900">
                Apenas em estoque
              </Text>
              <Text className="text-xs text-muted">
                Esconde produtos indisponíveis.
              </Text>
            </View>
            <Switch value={inStockOnly} onValueChange={setInStockOnly} />
          </View>

          <View className="mt-auto flex-row gap-3 pt-6">
            <View className="flex-1">
              <Button label="Limpar" variant="outline" onPress={reset} fullWidth />
            </View>
            <View className="flex-1">
              <Button label="Aplicar" onPress={apply} fullWidth />
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);
