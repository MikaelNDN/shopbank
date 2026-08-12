import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { Pressable, Text, View } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerItemList,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Loading } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/theme/tokens';

interface DrawerIconProps {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}

function DrawerIcon({ name, color }: DrawerIconProps) {
  return <FontAwesome name={name} size={18} color={color} />;
}

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="border-b border-border bg-primary-500 px-5 py-6">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-white">
            <FontAwesome name="shield" size={20} color={colors.primary[600]} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-white">ShopBank</Text>
            <Text className="text-xs text-white/80">Painel administrativo</Text>
          </View>
        </View>
        <Text className="mt-3 text-xs text-white/80">
          Logado como
        </Text>
        <Text className="text-sm font-semibold text-white">
          {user?.name ?? 'admin'}
        </Text>
      </View>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 8 }}
      >
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      <View className="border-t border-border p-4">
        <Pressable
          onPress={logout}
          className="flex-row items-center gap-3 rounded-lg px-3 py-3 active:bg-surface"
        >
          <FontAwesome name="sign-out" size={18} color={colors.danger} />
          <Text className="text-base font-semibold text-danger">Sair</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function AdminLayout() {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return <Loading message="Carregando..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role !== 'ADMIN') {
    return <Redirect href="/access-denied" />;
  }

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: colors.primary[600],
        drawerInactiveTintColor: colors.muted,
        drawerActiveBackgroundColor: colors.primary[50],
        drawerStyle: { width: 280 },
        drawerLabelStyle: { fontSize: 14, marginLeft: 4, fontWeight: '500' },
        drawerItemStyle: { borderRadius: 10, paddingHorizontal: 4 },
      }}
    >
      <Drawer.Screen
        name="dashboard"
        options={{
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color }) => (
            <DrawerIcon name="dashboard" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="products"
        options={{
          drawerLabel: 'Produtos',
          title: 'Produtos',
          drawerIcon: ({ color }) => <DrawerIcon name="cube" color={color} />,
        }}
      />
      <Drawer.Screen
        name="categories"
        options={{
          drawerLabel: 'Categorias',
          drawerIcon: ({ color }) => <DrawerIcon name="tags" color={color} />,
        }}
      />
      <Drawer.Screen
        name="inventory"
        options={{
          drawerLabel: 'Estoque',
          drawerIcon: ({ color }) => (
            <DrawerIcon name="archive" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="orders"
        options={{
          drawerLabel: 'Pedidos',
          drawerIcon: ({ color }) => (
            <DrawerIcon name="shopping-bag" color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="customers"
        options={{
          drawerLabel: 'Clientes',
          drawerIcon: ({ color }) => <DrawerIcon name="users" color={color} />,
        }}
      />
      <Drawer.Screen
        name="reports"
        options={{
          drawerLabel: 'Relatórios',
          drawerIcon: ({ color }) => (
            <DrawerIcon name="bar-chart" color={color} />
          ),
        }}
      />
    </Drawer>
  );
}
