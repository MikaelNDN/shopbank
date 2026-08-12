import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

interface ImageUploaderProps {
  uri?: string;
  onChange: (uri: string) => void;
}

export function ImageUploader({ uri, onChange }: ImageUploaderProps) {
  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({
        type: 'error',
        text1: 'Permissão negada',
        text2: 'Habilite acesso à galeria nas configurações.',
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri);
    }
  };

  return (
    <Pressable
      onPress={pick}
      className="aspect-square w-full overflow-hidden rounded-xl border-2 border-dashed border-border bg-surface active:opacity-80"
    >
      {uri ? (
        <View className="relative h-full w-full">
          <Image
            source={{ uri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
          <View className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1.5">
            <Text className="text-xs font-semibold text-white">Trocar</Text>
          </View>
        </View>
      ) : (
        <View className="h-full w-full items-center justify-center">
          <FontAwesome name="camera" size={32} color="#9ca3af" />
          <Text className="mt-2 text-sm font-medium text-gray-700">
            Selecionar imagem
          </Text>
          <Text className="text-xs text-muted">Toque para escolher</Text>
        </View>
      )}
    </Pressable>
  );
}
