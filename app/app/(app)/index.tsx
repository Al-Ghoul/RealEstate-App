import { View, Text } from "react-native";
import { useTheme } from "react-native-paper";
import { useI18nContext } from "@/i18n/i18n-react";
import { useCurrentUserProfile } from "@/lib/queries/user";

export default function HomeScreen() {
  const theme = useTheme();
  const { LL } = useI18nContext();
  const currentUserProfile = useCurrentUserProfile();

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
        {LL.WELCOME({ name: currentUserProfile?.data?.firstName })}
      </Text>
    </View>
  );
}
