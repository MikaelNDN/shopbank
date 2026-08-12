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

import { productApi } from '@/api/productApi';
import { ProductForm, type ProductFormSubmit } from '@/components/admin/ProductForm';
import { Loading } from '@/components/common';
import { useCategories } from '@/hooks/useCategories';

export default function NewProductScreen() {
  const router = useRouter();
  const { categories, isLoading } = useCategories();

  const submit = async (values: ProductFormSubmit) => {
    try {
      await productApi.create(values);
      Toast.show({ type: 'success', text1: 'Produto criado' });
      router.back();
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Falha ao criar',
        text2: e instanceof Error ? e.message : undefined,
      });
    }
  };

  if (isLoading) return <Loading message="Carregando..." />;

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
              Novo produto
            </Text>
          </View>
          <View className="px-6">
            <ProductForm
              categories={categories}
              submitLabel="Criar produto"
              onSubmit={submit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
