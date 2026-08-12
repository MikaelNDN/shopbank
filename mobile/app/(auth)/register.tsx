import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
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
import { formatCpf } from '@/utils/formatCpf';
import { isValidCpf } from '@/utils/validators';

const schema = z
  .object({
    name: z.string().min(3, 'Nome muito curto'),
    email: z.string().min(1, 'Informe o e-mail').email('E-mail inválido'),
    cpf: z.string().refine((v) => isValidCpf(v), 'CPF inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      cpf: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const user = await register({
        name: values.name,
        email: values.email,
        cpf: values.cpf,
        password: values.password,
      });
      Toast.show({ type: 'success', text1: `Bem-vindo, ${user.name}!` });
      router.replace('/(client)/(tabs)/home');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao cadastrar';
      Toast.show({ type: 'error', text1: 'Falha no cadastro', text2: message });
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
          <View className="flex-1 px-6 py-10">
            <View className="mb-8">
              <Text className="text-3xl font-bold text-gray-900">
                Criar conta
              </Text>
              <Text className="mt-1 text-base text-muted">
                Cadastre-se para comprar
              </Text>
            </View>

            <View className="gap-4">
              <Controller
                control={control}
                name="name"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Nome completo"
                    placeholder="Seu nome"
                    autoCapitalize="words"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.name?.message}
                  />
                )}
              />

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
                name="cpf"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="CPF"
                    placeholder="000.000.000-00"
                    keyboardType="number-pad"
                    value={value}
                    onChangeText={(text) => onChange(formatCpf(text))}
                    onBlur={onBlur}
                    error={errors.cpf?.message}
                    maxLength={14}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange, onBlur } }) => (
                  <PasswordInput
                    label="Senha"
                    placeholder="Mínimo 6 caracteres"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { value, onChange, onBlur } }) => (
                  <PasswordInput
                    label="Confirmar senha"
                    placeholder="Repita a senha"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.confirmPassword?.message}
                  />
                )}
              />

              <Button
                label="Cadastrar"
                size="lg"
                fullWidth
                loading={isSubmitting}
                onPress={handleSubmit(onSubmit)}
              />
            </View>

            <View className="mt-8 flex-row items-center justify-center">
              <Text className="text-sm text-muted">Já tem conta? </Text>
              <Link href="/(auth)/login" asChild>
                <Text className="text-sm font-semibold text-primary-600">Entrar</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
