import { forwardRef, useState } from 'react';
import {
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    hint,
    leftIcon,
    rightSlot,
    containerClassName,
    onFocus,
    onBlur,
    editable = true,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false);

  const borderClass = error
    ? 'border-danger'
    : focused
      ? 'border-primary-500'
      : 'border-border';

  return (
    <View className={containerClassName ?? 'w-full'}>
      {label ? (
        <Text className="mb-1 text-sm font-medium text-gray-800">{label}</Text>
      ) : null}
      <View
        className={`flex-row items-center rounded-lg border bg-white px-3 ${borderClass} ${editable ? '' : 'opacity-60'}`}
      >
        {leftIcon ? <View className="mr-2">{leftIcon}</View> : null}
        <TextInput
          ref={ref}
          className="flex-1 py-3 text-base text-gray-900"
          placeholderTextColor="#9ca3af"
          editable={editable}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {rightSlot ? <View className="ml-2">{rightSlot}</View> : null}
      </View>
      {error ? (
        <Text className="mt-1 text-xs text-danger">{error}</Text>
      ) : hint ? (
        <Text className="mt-1 text-xs text-muted">{hint}</Text>
      ) : null}
    </View>
  );
});
