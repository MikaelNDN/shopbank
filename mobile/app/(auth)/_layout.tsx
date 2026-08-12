import { Redirect, Stack } from 'expo-router';

import { Loading } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';

export default function AuthLayout() {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return <Loading message="Carregando..." />;
  }

  if (isAuthenticated && user) {
    if (user.role === 'ADMIN') {
      return <Redirect href="/(admin)/dashboard" />;
    }
    return <Redirect href="/(client)/(tabs)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
