import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { categoryApi } from '@/api/categoryApi';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button, EmptyState, Input, Loading } from '@/components/common';
import type { Category } from '@/types/product';

interface CategoryWithCount extends Category {
  productCount: number;
}

export default function AdminCategoriesScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const list = await categoryApi.listWithCounts();
    setItems(list);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetch();
    }, [fetch]),
  );

  const closeModal = () => {
    setEditing(null);
    setCreating(false);
    setName('');
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      if (editing) {
        await categoryApi.update(editing.id, name);
        Toast.show({ type: 'success', text1: 'Categoria atualizada' });
      } else {
        await categoryApi.create(name);
        Toast.show({ type: 'success', text1: 'Categoria criada' });
      }
      closeModal();
      await fetch();
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Falhou',
        text2: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (cat: CategoryWithCount) => {
    if (cat.productCount > 0) {
      Alert.alert(
        'Não pode excluir',
        `Categoria possui ${cat.productCount} produto(s) vinculado(s).`,
      );
      return;
    }
    Alert.alert('Excluir', `Remover "${cat.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await categoryApi.remove(cat.id);
            Toast.show({ type: 'success', text1: 'Categoria excluída' });
            fetch();
          } catch (e) {
            Alert.alert(
              'Erro',
              e instanceof Error ? e.message : 'Falhou',
            );
          }
        },
      },
    ]);
  };

  if (loading) return <Loading message="Carregando categorias..." />;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AdminHeader title="Categorias" subtitle={`${items.length} categorias`} />

      {items.length === 0 ? (
        <EmptyState
          icon="tags"
          title="Nenhuma categoria"
          description="Crie a primeira categoria."
          ctaLabel="Nova categoria"
          onCtaPress={() => setCreating(true)}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 96,
            gap: 10,
          }}
          renderItem={({ item }) => (
            <View className="flex-row items-center rounded-xl border border-border bg-white p-4">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-50">
                <FontAwesome name="tag" size={16} color="#b84613" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-sm font-semibold text-gray-900">
                  {item.name}
                </Text>
                <Text className="text-xs text-muted">
                  {item.productCount}{' '}
                  {item.productCount === 1 ? 'produto' : 'produtos'} · slug{' '}
                  {item.slug}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setEditing(item);
                  setName(item.name);
                }}
                hitSlop={8}
                className="mr-3"
              >
                <FontAwesome name="pencil" size={16} color="#374151" />
              </Pressable>
              <Pressable
                onPress={() => handleDelete(item)}
                hitSlop={8}
                disabled={item.productCount > 0}
              >
                <FontAwesome
                  name="trash-o"
                  size={18}
                  color={item.productCount > 0 ? '#d1d5db' : '#dc2626'}
                />
              </Pressable>
            </View>
          )}
        />
      )}

      <Pressable
        onPress={() => setCreating(true)}
        style={{ position: 'absolute', right: 24, bottom: insets.bottom + 24 }}
        className="h-14 w-14 items-center justify-center rounded-full bg-primary-500 shadow-lg active:bg-primary-600"
      >
        <FontAwesome name="plus" size={20} color="#fff" />
      </Pressable>

      <Modal
        visible={editing !== null || creating}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View className="w-full rounded-2xl bg-white p-6">
            <Text className="text-lg font-bold text-gray-900">
              {editing ? 'Editar categoria' : 'Nova categoria'}
            </Text>
            <View className="mt-4">
              <Input
                label="Nome"
                value={name}
                onChangeText={setName}
                autoFocus
                placeholder="Ex: Eletrônicos"
              />
            </View>
            <View className="mt-6 flex-row gap-3">
              <View className="flex-1">
                <Button
                  label="Cancelar"
                  variant="outline"
                  onPress={closeModal}
                  fullWidth
                />
              </View>
              <View className="flex-1">
                <Button
                  label="Salvar"
                  onPress={submit}
                  loading={submitting}
                  fullWidth
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
