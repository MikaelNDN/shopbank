import { useEffect } from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface SkeletonProps extends ViewProps {
  width?: number | `${number}%`;
  height?: number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const radiusMap: Record<NonNullable<SkeletonProps['rounded']>, number> = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};

export function Skeleton({
  width = '100%',
  height = 16,
  rounded = 'md',
  style,
  ...rest
}: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 700 }),
        withTiming(0.4, { duration: 700 }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: radiusMap[rounded],
          backgroundColor: '#e5e7eb',
          overflow: 'hidden',
        },
        style,
      ]}
      {...rest}
    >
      <Animated.View
        style={[
          { flex: 1, backgroundColor: '#d1d5db' },
          animatedStyle,
        ]}
      />
    </View>
  );
}
