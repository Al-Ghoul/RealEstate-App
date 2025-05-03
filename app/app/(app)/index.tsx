import { View, Text } from "react-native";
import { useTheme } from "react-native-paper";

export default function HomeScreen() {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        backgroundColor: theme.colors.background,
      }}
    >
      <Text
        style={{
          textAlign: "center",
          fontSize: 30,
          color: theme.colors.secondary,
        }}
      >
        Welcome
      </Text>
    </View>
  );
}
