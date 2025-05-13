import { View, Text, StyleSheet } from "react-native";
import { FAB, useTheme } from "react-native-paper";
import { useI18nContext } from "@/i18n/i18n-react";
import { useCurrentUserProfile } from "@/lib/queries/user";
import { useAuthStore } from "@/lib/stores/authStore";
import { router } from "expo-router";

export default function HomeScreen() {
  const theme = useTheme();
  const { LL } = useI18nContext();
  const currentUserProfile = useCurrentUserProfile();
  const roles = useAuthStore((state) => state.session?.roles);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
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

      {roles?.includes("admin") || roles?.includes("agent") ? (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => router.push("/add-property", { withAnchor: true })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
