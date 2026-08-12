import FontAwesome from '@expo/vector-icons/FontAwesome';
import { forwardRef, useState } from 'react';
import { Pressable, type TextInput } from 'react-native';

import { Input } from './Input';

interface PasswordInputProps extends React.ComponentProps<typeof Input> {}

export const PasswordInput = forwardRef<TextInput, PasswordInputProps>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <Input
        ref={ref}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        rightSlot={
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
            accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
          >
            <FontAwesome
              name={visible ? 'eye-slash' : 'eye'}
              size={18}
              color="#6b7280"
            />
          </Pressable>
        }
        {...props}
      />
    );
  },
);
