import type { Themes } from "@/lib/stores/themeStore";
import { Feather } from "@expo/vector-icons";
import { Pressable } from "react-native";
import { useTheme } from "react-native-paper";

interface ThemeToggleProps {
  currentTheme: Themes;
  setTheme: (theme: Themes) => void;
}
export default function ThemeToggle({
  currentTheme,
  setTheme,
}: ThemeToggleProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => setTheme(currentTheme === "light" ? "dark" : "light")}
    >
      {currentTheme === "light" ? (
        <Feather name="sun" size={24} color={theme.colors.primary} />
      ) : (
        <Feather name="moon" size={24} color={theme.colors.primary} />
      )}
    </Pressable>
  );
}
