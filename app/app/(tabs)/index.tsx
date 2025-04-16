import { Pressable, Text, View } from "react-native";
import { ThemeSwitcher } from "@/components/themes/ThemeSwitcher";
import { useSession } from "@/components/AuthContext";

export default function HomeScreen() {
  const { logout } = useSession();
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
