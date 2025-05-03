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
}: Omit<FinalInputProps<T>, "value" | "onBlur" | "onChangeText">) {
  const { errors } = useFormState<T>({ control, name, exact: true });
  const theme = useTheme();
  return (
    <>
      <Controller
        control={control}
        rules={{
          required: true,
        }}
        render={({ field: { onChange, onBlur, value } }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Input
              style={style}
              id={id}
              placeholder={placeholder}
              keyboardType={keyboardType}
              secureTextEntry={secureTextEntry}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline={multiline}
            />
            {children}
          </View>
        )}
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
