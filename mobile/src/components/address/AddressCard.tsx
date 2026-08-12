import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, Text, View } from 'react-native';

import type { Address } from '@/types/address';
import { formatZipCode } from '@/utils/formatZipCode';

interface AddressCardProps {
  address: Address;
  onPress?: () => void;
  onSetFavorite?: () => void;
  onDelete?: () => void;
}

export function AddressCard({
  address,
  onPress,
  onSetFavorite,
  onDelete,
}: AddressCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-xl border border-border bg-white p-4 active:bg-surface"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <FontAwesome name="map-marker" size={16} color="#ed751e" />
          <Text className="text-base font-semibold text-gray-900">
            {address.label}
          </Text>
        </View>
        {address.isFavorite ? (
          <View className="flex-row items-center gap-1 rounded-full bg-primary-50 px-2 py-1">
            <FontAwesome name="star" size={10} color="#b84613" />
            <Text className="text-[11px] font-semibold text-primary-700">
              Favorito
            </Text>
          </View>
        ) : null}
      </View>
      <Text className="mt-3 text-sm text-gray-700">
        {address.street}, {address.number}
        {address.complement ? ` - ${address.complement}` : ''}
      </Text>
      <Text className="text-sm text-muted">
        {address.neighborhood} · {address.city}/{address.state}
      </Text>
      <Text className="text-sm text-muted">CEP {formatZipCode(address.zipCode)}</Text>

      {(onSetFavorite || onDelete) ? (
        <View className="mt-3 flex-row gap-3 border-t border-border pt-3">
          {onSetFavorite && !address.isFavorite ? (
            <Pressable onPress={onSetFavorite} hitSlop={8}>
              <Text className="text-xs font-semibold text-primary-600">
                Marcar como favorito
              </Text>
            </Pressable>
          ) : null}
          {onDelete ? (
            <Pressable
              onPress={onDelete}
              hitSlop={8}
              className="ml-auto"
            >
              <Text className="text-xs font-semibold text-danger">Excluir</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}
