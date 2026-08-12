import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
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
import type { Product } from '@/types/product';

export default function EditProductScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { categories } = useCategories();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    productApi.getById(id).then((data) => {
      setProduct(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <Loading message="Carregando..." />;

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Text className="m-6 text-base text-danger">
          Produto não encontrado.
        </Text>
      </SafeAreaView>
    );
  }

  const submit = async (values: ProductFormSubmit) => {
    try {
      await productApi.update(product.id, values);
      Toast.show({ type: 'success', text1: 'Produto atualizado' });
      router.back();
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Falha ao salvar',
        text2: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir produto',
      `Remover "${product.name}" definitivamente?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await productApi.remove(product.id);
              Toast.show({ type: 'success', text1: 'Produto excluído' });
              router.back();
            } catch (e) {
              Alert.alert(
                'Não foi possível excluir',
                e instanceof Error ? e.message : 'Erro desconhecido',
              );
            }
          },
        },
      ],
    );
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
          <View className="flex-row items-center justify-between px-6 py-4">
            <View className="flex-row items-center">
              <Pressable onPress={() => router.back()} hitSlop={12}>
                <FontAwesome name="angle-left" size={24} color="#111827" />
              </Pressable>
              <Text className="ml-3 text-2xl font-bold text-gray-900">
                Editar produto
              </Text>
            </View>
            <Pressable onPress={handleDelete} hitSlop={12}>
              <FontAwesome name="trash-o" size={20} color="#dc2626" />
            </Pressable>
          </View>
          <View className="px-6">
            <ProductForm
              initial={product}
              categories={categories}
              submitLabel="Salvar alterações"
              onSubmit={submit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
