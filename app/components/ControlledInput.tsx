import {
  Controller,
  type Path,
  type Control,
  type FieldValues,
  useFormState,
} from "react-hook-form";
import {
  View,
  Text,
  TextInput,
  ViewStyle,
  type KeyboardTypeOptions,
} from "react-native";
import { useTheme } from "react-native-paper";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

type InputProps = {
  id: string;
  placeholder: string;
  value: string;
  keyboardType: KeyboardTypeOptions;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  secureTextEntry?: boolean;
  multiline?: boolean;
  style: ViewStyle;
  maxLength?: number;
};

const Input = ({
  id,
  placeholder,
  value,
  keyboardType,
  onChangeText,
  onBlur,
  secureTextEntry,
  multiline,
  style,
  maxLength,
}: InputProps) => {
  const theme = useTheme();

  return (
    <View style={style}>
      <TextInput
        style={{
          width: "100%",
          color: theme.colors.secondary,
        }}
        id={id}
        placeholderTextColor={theme.colors.secondary}
        placeholder={placeholder}
        value={value}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        onBlur={onBlur}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        maxLength={maxLength}
      />
    </View>
  );
};

interface FinalInputProps<T extends FieldValues> extends InputProps {
  control: Control<T>;
  name: Path<T>;
  id: Path<T>;
  children?: React.ReactNode;
}

export default function ControlledInput<T extends FieldValues>({
  control,
  name,
  id,
  placeholder,
  keyboardType,
  secureTextEntry,
  children,
  style,
  multiline,
  maxLength,
}: Omit<FinalInputProps<T>, "value" | "onBlur" | "onChangeText">) {
  const { errors } = useFormState<T>({ control, name, exact: true });
  const theme = useTheme();
  const shakeOffset = useSharedValue(0);

  const triggerShake = () => {
    shakeOffset.value = withSequence(
      withTiming(10, { duration: 50, easing: Easing.linear }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shakeOffset.value }],
    };
  });

  return (
    <>
      <Controller
        control={control}
        rules={{
          required: true,
        }}
        render={({ field: { onChange, onBlur, value } }) => {
          return (
            <Animated.View
              style={[
                {
                  flexDirection: multiline ? "column" : "row",
                  alignItems: "center",
                },
                animatedStyle,
              ]}
            >
              <Input
                style={style}
                id={id}
                placeholder={placeholder}
                keyboardType={keyboardType}
                secureTextEntry={secureTextEntry}
                value={value}
                onChangeText={(text) => {
                  if (!maxLength) {
                    onChange(text);
                    return;
                  } else if (text.length <= maxLength) {
                    onChange(text);
                  } else {
                    triggerShake();
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Error,
                    );
                  }
                }}
                onBlur={onBlur}
                multiline={multiline}
              />

              {maxLength ? (
                <Text
                  style={{
                    color:
                      value?.length === maxLength
                        ? theme.colors.error
                        : theme.colors.secondary,
                  }}
                >
                  {value?.length || 0}/{maxLength}
                </Text>
              ) : null}

              {children}
            </Animated.View>
          );
        }}
        name={name}
      />
      {errors[name]?.message ? (
        <Text style={{ color: theme.colors.error, textAlign: "center" }}>
          {errors[name].message as string}
        </Text>
      ) : null}
    </>
  );
}
