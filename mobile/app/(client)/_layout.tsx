import { Redirect, Stack } from 'expo-router';

import { Loading } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';

export default function ClientLayout() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <Loading message="Carregando..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
