import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { forwardRef, useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { ProductFilters } from '@/types/product';

type SortKey = NonNullable<ProductFilters['sortBy']>;

interface SortSheetProps {
  value: SortKey;
  onChange: (next: SortKey) => void;
}

const OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'relevance', label: 'Mais relevantes' },
  { key: 'price-asc', label: 'Menor preço' },
  { key: 'price-desc', label: 'Maior preço' },
  { key: 'name-asc', label: 'Nome (A-Z)' },
  { key: 'newest', label: 'Mais novos' },
];

export const SortSheet = forwardRef<BottomSheetModal, SortSheetProps>(
  function SortSheet({ value, onChange }, ref) {
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

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['45%']}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: '#9ca3af' }}
      >
        <BottomSheetView style={{ flex: 1, padding: 24 }}>
          <Text className="text-xl font-bold text-gray-900">Ordenar por</Text>
          <View className="mt-4 gap-1">
            {OPTIONS.map((opt) => {
              const selected = value === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => onChange(opt.key)}
                  className={`flex-row items-center justify-between rounded-lg px-4 py-3 ${
                    selected ? 'bg-primary-50' : 'active:bg-surface'
                  }`}
                >
                  <Text
                    className={`text-base ${
                      selected
                        ? 'font-semibold text-primary-700'
                        : 'text-gray-900'
                    }`}
                  >
                    {opt.label}
                  </Text>
                  {selected ? (
                    <FontAwesome name="check" size={16} color="#b84613" />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);
