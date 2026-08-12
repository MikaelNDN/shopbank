import { Redirect } from 'expo-router';

import { Loading } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';

export default function IndexScreen() {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return <Loading message="Carregando..." />;
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user.role === 'ADMIN') {
    return <Redirect href="/(admin)/dashboard" />;
  }

  return <Redirect href="/(client)/(tabs)/home" />;
}
