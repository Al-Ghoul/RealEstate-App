import { Dimensions, View, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { DrawerLayout } from "react-native-gesture-handler";
import { useMutation } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import { LoginManager } from "react-native-fbsdk-next";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useAuthStore } from "@/lib/stores/authStore";
import { router } from "expo-router";
import { useCurrentUser } from "@/lib/queries/user";
import { Button, useTheme } from "react-native-paper";

interface GenericViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function GenericView({ children, style }: GenericViewProps) {
  const originalWidth = 1440;
  const originalHeight = 320;
  const aspectRatio = originalWidth / originalHeight;
  const windowWidth = Dimensions.get("window").width;
  const theme = useTheme();
  const logout = useAuthStore((state) => state.logout);
  const currentUser = useCurrentUser();

  const logoutMutation = useMutation({
    mutationFn: () => xiorInstance.post("/auth/me/logout"),
  });

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        style,
      ]}
    >
      <DrawerLayout
        drawerWidth={windowWidth / 2.3}
        drawerPosition={"right"}
        drawerType="slide"
        renderNavigationView={() => (
          <View
            style={{
              flex: 1,
              gap: 8,
              margin: 40,
            }}
          >
            <Button
              style={{
                marginHorizontal: "auto",
                width: "100%",
                borderRadius: 8,
              }}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              onPress={() => {
                router.push("/edit-profile", { withAnchor: true });
              }}
            >
              Edit Profile
            </Button>
            <Button
              style={{
                marginHorizontal: "auto",
                width: "100%",
                borderRadius: 8,
              }}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              onPress={() => {
                if (currentUser.data?.hasPassword)
                  router.push("/change-password");
                else router.push("/set-password");
              }}
            >
              {currentUser.data?.hasPassword
                ? "Change Password"
                : "Set Password"}
            </Button>
            <Button
              style={{
                marginHorizontal: "auto",
                width: "100%",
                borderRadius: 8,
              }}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              disabled={logoutMutation.isPending}
              onPress={() => {
                logoutMutation.mutateAsync().finally(() => {
                  logout();
                  GoogleSignin.signOut();
                  LoginManager.logOut();
                  router.replace("/");
                });
              }}
            >
              Logout
            </Button>
          </View>
        )}
      >
        {children}
        <View
          style={{
            width: windowWidth,
            aspectRatio,
            position: "absolute",
            bottom: 0,
          }}
        >
          <Svg
            viewBox={`0 0 ${originalWidth} ${originalHeight}`}
            width="100%"
            height="100%"
          >
            <Path
              fill={theme.colors.primary}
              d="m0 128 48-5.3c48-5.7 144-15.7 240 10.6C384 160 480 224 576 240s192-16 288-42.7c96-26.3 192-48.3 288-42.6 96 5.3 192 37.3 240 53.3l48 16v96H0Z"
            />
          </Svg>
        </View>
      </DrawerLayout>
    </View>
  );
}
