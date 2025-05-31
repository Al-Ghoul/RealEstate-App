import { Redirect, Tabs } from "expo-router";
import React, { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { addAuthHeader, xiorInstance } from "@/lib/fetcher";
import type { XiorResponse } from "xior";
import errorRetry from "xior/plugins/error-retry";
import setupTokenRefresh from "xior/plugins/token-refresh";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Pressable, Appearance, View, Text } from "react-native";
import ProfileImage from "@/components/profile/Image";
import { useThemeStore } from "@/lib/stores/themeStore";
import { useTheme } from "react-native-paper";
import { useCurrentUser } from "@/lib/queries/user";
import { ProfileImageSkeleton } from "@/components/profile/Skeleton";
import { useI18nContext } from "@/i18n/i18n-react";

export default function TabLayout() {
  const theme = useTheme();
  const { LL } = useI18nContext();
  const tokens = useAuthStore((state) => state.session?.tokens);
  const logout = useAuthStore((state) => state.logout);
  const login = useAuthStore((state) => state.login);
  const setTheme = useThemeStore((state) => state.setTheme);
  const currentUser = useCurrentUser();
  const currentTheme =
    useThemeStore((state) => state.theme) ??
    Appearance.getColorScheme() ??
    "light";

  useEffect(() => {
    if (tokens) addAuthHeader(tokens.accessToken);

    xiorInstance.interceptors.response.use(
      (result) => {
        return result;
      },
      async (error) => {
        if (
          error.request?.url?.endsWith("/refresh") &&
          error.request.method === "POST"
        ) {
          logout();
        }
        return Promise.reject(error);
      },
    );

    function shouldRefresh(response: XiorResponse) {
      return Boolean(
        tokens?.accessToken &&
          response?.status &&
          [401, 403].includes(response.status),
      );
    }

    const retryPluginHandle = xiorInstance.plugins.use(
      errorRetry({
        enableRetry: (_, error) => {
          if (error?.response && shouldRefresh(error.response)) {
            return true;
          }
        },
      }),
    );

    setupTokenRefresh(xiorInstance, {
      shouldRefresh,
      async refreshToken(error) {
        try {
          const { data, status } = await xiorInstance.post("/auth/refresh", {
            refreshToken: tokens?.refreshToken,
          });
          if (status === 200 && data) {
            const tokens = data.data as JWTPayload;
            login(tokens);
            addAuthHeader(tokens.accessToken);
          } else {
            logout();
            throw error;
          }
        } catch {
          logout();
          return Promise.reject(error);
        }
      },
    });

    return () => {
      xiorInstance.plugins.eject(retryPluginHandle);
      xiorInstance.interceptors.request.clear();
      xiorInstance.interceptors.response.clear();
    };
  }, [tokens, login, logout]);

  if (!tokens) return <Redirect href="/get-started" />;

  return (
    <Tabs
      initialRouteName="index"
      backBehavior="history"
      screenOptions={{
        headerShown: true,
        headerTitleAllowFontScaling: true,
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerShadowVisible: true,
        headerTintColor: theme.colors.primary,
        tabBarActiveTintColor: theme.colors.onBackground,
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: theme.colors.background,
        },
        tabBarShowLabel: true,
        headerRight: () => (
          <Pressable
            onPress={() =>
              setTheme(currentTheme === "light" ? "dark" : "light")
            }
          >
            <Text
              style={{
                color: theme.colors.primary,
              }}
            >
              Toggle Theme
            </Text>
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: LL.HOME(),
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome5 size={28} name="home" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="(user)/profile"
        options={{
          title: LL.PROFILE(),
          headerTitleAlign: "center",
          headerShown: false,
          animation: "shift",
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: focused ? 20 : 28,
                height: focused ? 20 : 28,
              }}
            >
              {currentUser.data ? <ProfileImage /> : <ProfileImageSkeleton />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="(user)/edit-profile"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="(user)/change-password"
        options={{
          title: "Change Password",
          href: null,
        }}
      />

      <Tabs.Screen
        name="(user)/set-password"
        options={{
          title: "Set Password",
          href: null,
        }}
      />

      <Tabs.Screen
        name="property/add"
        options={{
          title: "Add Property",
          href: null,
        }}
      />

      <Tabs.Screen
        name="property/[id]/index"
        options={{
          headerShown: false,
          title: "Property Details",
          href: null,
        }}
      />

      <Tabs.Screen
        name="property/[id]/edit"
        options={{
          headerShown: true,
          title: "Edit Property",
          href: null,
        }}
      />

      <Tabs.Screen
        name="property/[id]/media/add"
        options={{
          headerShown: true,
          title: "Add Media",
          href: null,
        }}
      />
    </Tabs>
  );
}
