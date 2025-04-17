import { Pressable, Text, View } from "react-native";
import { ThemeSwitcher } from "@/components/themes/ThemeSwitcher";
import { useAuthStore } from "@/lib/stores/authStore";

export default function HomeScreen() {
  const logout = useAuthStore((state) => state.logout);
  return (
    <View className="flex-1 bg-secondary items-center justify-center">
      <Text className="text-primary">Welcome</Text>
      <Pressable className="bg-gray-500" onPress={() => logout()}>
        <Text>Log Out</Text>
      </Pressable>
      <ThemeSwitcher />
    </View>
  );
}
