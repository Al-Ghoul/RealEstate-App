import { Pressable, Text, View } from "react-native";
import { useThemeContextActions } from "./.";

export function ThemeSwitcher() {
  const { handleThemeSwitch } = useThemeContextActions();
  return (
    <View className="flex-row gap-4">
      <Pressable
        onPress={() => handleThemeSwitch("light")}
        className="h-40 w-40 bg-outstand justify-center rounded-lg"
      >
        <Text className="text-lg font-semibold text-primary text-center">
          Light
        </Text>
      </Pressable>

      <Pressable
        onPress={() => handleThemeSwitch("dark")}
        className="h-40 w-40 bg-outstand justify-center rounded-lg"
      >
        <Text className="text-lg font-semibold text-primary text-center">
          Dark
        </Text>
      </Pressable>
    </View>
  );
}
