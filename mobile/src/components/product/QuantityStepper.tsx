import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, Text, View } from 'react-native';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  disabled = false,
}: QuantityStepperProps) {
  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && value < max;

  return (
    <View className="flex-row items-center rounded-lg border border-border bg-white">
      <StepperButton
        icon="minus"
        onPress={() => canDecrement && onChange(value - 1)}
        disabled={!canDecrement}
      />
      <View className="min-w-[40px] items-center px-2">
        <Text className="text-base font-semibold text-gray-900">{value}</Text>
      </View>
      <StepperButton
        icon="plus"
        onPress={() => canIncrement && onChange(value + 1)}
        disabled={!canIncrement}
      />
    </View>
  );
}

interface StepperButtonProps {
  icon: 'plus' | 'minus';
  onPress: () => void;
  disabled: boolean;
}

function StepperButton({ icon, onPress, disabled }: StepperButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      className={`h-10 w-10 items-center justify-center ${
        disabled ? 'opacity-30' : 'active:bg-surface'
      }`}
    >
      <FontAwesome name={icon} size={14} color="#374151" />
    </Pressable>
  );
}
