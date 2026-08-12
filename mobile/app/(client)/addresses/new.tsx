import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { addressApi } from '@/api/addressApi';
import { AddressForm } from '@/components/address/AddressForm';
import { useAuth } from '@/hooks/useAuth';
import { unformatZipCode } from '@/utils/formatZipCode';

export default function NewAddressScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const onSubmit = async (values: Parameters<
    React.ComponentProps<typeof AddressForm>['onSubmit']
  >[0]) => {
    if (!user) return;
    try {
      await addressApi.create(user.id, {
        label: values.label,
        zipCode: unformatZipCode(values.zipCode),
        street: values.street,
        number: values.number,
        complement: values.complement || undefined,
        neighborhood: values.neighborhood,
        city: values.city,
        state: values.state.toUpperCase(),
        isFavorite: !!values.isFavorite,
      });
      Toast.show({ type: 'success', text1: 'Endereço cadastrado' });
      router.back();
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Falha ao salvar',
        text2: e instanceof Error ? e.message : undefined,
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center px-6 py-4">
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <FontAwesome name="angle-left" size={24} color="#111827" />
            </Pressable>
            <Text className="ml-3 text-2xl font-bold text-gray-900">
              Novo endereço
            </Text>
          </View>

          <View className="px-6">
            <AddressForm submitLabel="Salvar endereço" onSubmit={onSubmit} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
