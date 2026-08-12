import { ActivityIndicator, Text, View } from 'react-native';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export function Loading({ message, fullScreen = true }: LoadingProps) {
  return (
    <View
      className={`items-center justify-center ${
        fullScreen ? 'flex-1 bg-background' : ''
      }`}
    >
      <ActivityIndicator size="large" color="#ed751e" />
      {message ? (
        <Text className="mt-3 text-sm text-muted">{message}</Text>
      ) : null}
    </View>
  );
}
