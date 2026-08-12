import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const containerByVariant: Record<Variant, string> = {
  primary: 'bg-primary-500 active:bg-primary-600',
  secondary: 'bg-secondary-600 active:bg-secondary-700',
  outline: 'bg-transparent border border-primary-500 active:bg-primary-50',
  ghost: 'bg-transparent active:bg-gray-100',
  danger: 'bg-danger active:opacity-80',
};

const textByVariant: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-white',
  outline: 'text-primary-600',
  ghost: 'text-gray-900',
  danger: 'text-white',
};

const containerBySize: Record<Size, string> = {
  sm: 'h-9 px-3 rounded-md',
  md: 'h-12 px-5 rounded-lg',
  lg: 'h-14 px-6 rounded-xl',
};

const textBySize: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      disabled={isDisabled}
      className={[
        'flex-row items-center justify-center',
        containerByVariant[variant],
        containerBySize[size],
        fullWidth ? 'w-full' : '',
        isDisabled ? 'opacity-50' : '',
        typeof className === 'string' ? className : '',
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#ed751e' : '#fff'} />
      ) : (
        <View className="flex-row items-center justify-center">
          {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
          <Text
            className={`font-semibold ${textByVariant[variant]} ${textBySize[size]}`}
          >
            {label}
          </Text>
          {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
}
