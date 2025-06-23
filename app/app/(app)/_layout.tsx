import { router, Tabs, useFocusEffect } from "expo-router";
import React, { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { addAuthHeader, xiorInstance } from "@/lib/fetcher";
import type { XiorResponse } from "xior";
import errorRetry from "xior/plugins/error-retry";
import setupTokenRefresh from "xior/plugins/token-refresh";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Appearance, View } from "react-native";
import ProfileImage from "@/components/profile/Image";
import { useThemeStore } from "@/lib/stores/themeStore";
import { useTheme } from "react-native-paper";
import { useCurrentUserProfile } from "@/lib/queries/user";
import { ProfileImageSkeleton } from "@/components/profile/Skeleton";
import { useI18nContext } from "@/i18n/i18n-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Entypo } from "@expo/vector-icons";
import { useWebSocketStore } from "@/lib/stores/useWebSocketStore";

export default function TabLayout() {
  const theme = useTheme();
  const { LL } = useI18nContext();
  const tokens = useAuthStore((state) => state.session?.tokens);
  const logout = useAuthStore((state) => state.logout);
  const login = useAuthStore((state) => state.login);
  const setTheme = useThemeStore((state) => state.setTheme);
  const currentUserProfile = useCurrentUserProfile();
  const currentTheme =
    useThemeStore((state) => state.theme) ??
    Appearance.getColorScheme() ??
    "light";
  const { connect, disconnect } = useWebSocketStore();

  useEffect(() => {
    connect(
      tokens?.accessToken
        ? `${process.env.EXPO_PUBLIC_WS_URL}?token=${tokens.accessToken}`
        : null,
    );
    return () => {
      disconnect();
    };
  }, [tokens?.accessToken, connect, disconnect]);

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
          [401, 403].includes(response.status) &&
          (response.data.message === LL.MISSING_AUTHORIZATION_TOKEN() ||
            response.data.message === LL.INVALID_ACCESS_TOKEN() ||
            response.data.message === LL.REVOKED_ACCESS_TOKEN()),
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
  }, [tokens, login, logout, LL]);

  useFocusEffect(() => {
    if (!tokens) return router.replace("/get-started");
  });

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
          <View style={{ margin: 16 }}>
            <ThemeToggle setTheme={setTheme} currentTheme={currentTheme} />
          </View>
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
        name="chat"
        options={{
          title: LL.CHAT(),
          headerShown: true,
          tabBarIcon: ({ color }) => (
            <Entypo name="chat" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="(user)/profile"
        options={{
          title: LL.PROFILE(),
          headerTitleAlign: "center",
          headerShown: false,
          tabBarIcon: ({ focused }) =>
            currentUserProfile?.data ? (
              <ProfileImage
                style={{ width: focused ? 20 : 28, height: focused ? 20 : 28 }}
                source={currentUserProfile.data.image}
                blurHash={currentUserProfile.data.imageBlurHash!}
              />
            ) : (
              <ProfileImageSkeleton
                style={{ width: 28, height: 28 }}
                isLoading
              />
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
          title: LL.CHANGE_PASSWORD(),
          href: null,
        }}
      />

      <Tabs.Screen
        name="(user)/set-password"
        options={{
          title: LL.SET_PASSWORD(),
          href: null,
        }}
      />

      <Tabs.Screen
        name="property/add"
        options={{
          title: LL.ADD_PROPERTY(),
          href: null,
        }}
      />

      <Tabs.Screen
        name="property/[id]/index"
        options={{
          headerShown: true,
          title: LL.PROPERTY_DETAILS(),
          href: null,
        }}
      />

      <Tabs.Screen
        name="property/[id]/edit"
        options={{
          headerShown: true,
          title: LL.EDIT_PROPERTY(),
          href: null,
        }}
      />

      <Tabs.Screen
        name="property/[id]/media/add"
        options={{
          headerShown: true,
          title: LL.ADD_PROPERTY_MEDIA(),
          href: null,
        }}
      />

      <Tabs.Screen
        name="(user)/user/[id]/profile/index"
        options={{
          headerShown: true,
          title: LL.USER_PROFILE(),
          href: null,
        }}
      />

      <Tabs.Screen
        name="(chat)/[id]/chat"
        options={{
          headerShown: true,
          title: LL.CHAT(),
          href: null,
        }}
      />
    </Tabs>
  );
}
