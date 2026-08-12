import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import { Button, Input, PasswordInput } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const { redirectTo } = useLocalSearchParams<{ redirectTo?: string }>();
  const { login } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const user = await login(values);
      Toast.show({ type: 'success', text1: `Bem-vindo, ${user.name}!` });
      if (redirectTo) {
        router.replace(redirectTo as never);
        return;
      }
      if (user.role === 'ADMIN') {
        router.replace('/(admin)/dashboard');
      } else {
        router.replace('/(client)/(tabs)/home');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao entrar';
      Toast.show({ type: 'error', text1: 'Falha no login', text2: message });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6 py-10">
            <View className="mb-8">
              <Text className="text-3xl font-bold text-gray-900">ShopBank</Text>
              <Text className="mt-1 text-base text-muted">
                Entre na sua conta
              </Text>
            </View>

            <View className="gap-4">
              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="E-mail"
                    placeholder="seu@email.com"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange, onBlur } }) => (
                  <PasswordInput
                    label="Senha"
                    placeholder="••••••"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                  />
                )}
              />

              <Button
                label="Entrar"
                size="lg"
                fullWidth
                loading={isSubmitting}
                onPress={handleSubmit(onSubmit)}
              />
            </View>

            <View className="mt-8 flex-row items-center justify-center">
              <Text className="text-sm text-muted">Não tem conta? </Text>
              <Link href="/(auth)/register" asChild>
                <Text className="text-sm font-semibold text-primary-600">Cadastre-se</Text>
              </Link>
            </View>

            <View className="mt-6 rounded-lg border border-border bg-surface p-3">
              <Text className="text-xs font-medium text-gray-700">
                Contas demo
              </Text>
              <Text className="mt-1 text-xs text-muted">
                cliente@shopbank.com / 123456
              </Text>
              <Text className="text-xs text-muted">
                admin@shopbank.com / 123456
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
