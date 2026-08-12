import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { forwardRef, useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { Address } from '@/types/address';
import { formatZipCode } from '@/utils/formatZipCode';

interface AddressSelectorProps {
  addresses: Address[];
  selectedId?: string;
  onSelect: (address: Address) => void;
}

export const AddressSelector = forwardRef<
  BottomSheetModal,
  AddressSelectorProps
>(function AddressSelector({ addresses, selectedId, onSelect }, ref) {
  const router = useRouter();

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
      snapPoints={['65%']}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: '#9ca3af' }}
    >
      <BottomSheetView style={{ flex: 1, paddingHorizontal: 24 }}>
        <Text className="text-xl font-bold text-gray-900">
          Selecionar endereço
        </Text>

        <ScrollView className="mt-4" contentContainerStyle={{ gap: 12 }}>
          {addresses.map((addr) => {
            const selected = addr.id === selectedId;
            return (
              <Pressable
                key={addr.id}
                onPress={() => onSelect(addr)}
                className={`rounded-xl border p-4 ${
                  selected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-border bg-white active:bg-surface'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <FontAwesome
                      name="map-marker"
                      size={14}
                      color={selected ? '#b84613' : '#6b7280'}
                    />
                    <Text className="text-sm font-semibold text-gray-900">
                      {addr.label}
                    </Text>
                    {addr.isFavorite ? (
                      <View className="rounded-full bg-primary-50 px-2 py-0.5">
                        <Text className="text-[10px] font-semibold text-primary-700">
                          Favorito
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {selected ? (
                    <FontAwesome name="check-circle" size={18} color="#b84613" />
                  ) : null}
                </View>
                <Text className="mt-2 text-sm text-gray-700">
                  {addr.street}, {addr.number}
                  {addr.complement ? ` - ${addr.complement}` : ''}
                </Text>
                <Text className="text-xs text-muted">
                  {addr.neighborhood} · {addr.city}/{addr.state} · CEP{' '}
                  {formatZipCode(addr.zipCode)}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => {
              (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
              router.push('/(client)/addresses/new');
            }}
            className="flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-primary-400 bg-primary-50 p-4 active:bg-primary-100"
          >
            <FontAwesome name="plus" size={14} color="#b84613" />
            <Text className="text-sm font-semibold text-primary-700">
              Cadastrar novo endereço
            </Text>
          </Pressable>
        </ScrollView>
      </BottomSheetView>
    </BottomSheetModal>
  );
});
