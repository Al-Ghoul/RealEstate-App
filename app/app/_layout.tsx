import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import AnimationScreen from "@/components/SplashScreen";
import FlashMessage from "react-native-flash-message";
import { StatusBar } from "expo-status-bar";
import { Appearance, Pressable, Text } from "react-native";
import { useThemeStore } from "@/lib/stores/themeStore";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider, useTheme } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { useReactQueryDevTools } from "@dev-plugins/react-query";
import { useAuthStore } from "@/lib/stores/authStore";
import { queryClient } from "@/lib/client";

const lightTheme = {
  colors: {
    primary: "rgb(0, 95, 175)",
    onPrimary: "rgb(255, 255, 255)",
    primaryContainer: "rgb(212, 227, 255)",
    onPrimaryContainer: "rgb(0, 28, 58)",
    secondary: "rgb(84, 95, 113)",
    onSecondary: "rgb(255, 255, 255)",
    secondaryContainer: "rgb(216, 227, 248)",
    onSecondaryContainer: "rgb(17, 28, 43)",
    tertiary: "rgb(110, 86, 118)",
    onTertiary: "rgb(255, 255, 255)",
    tertiaryContainer: "rgb(247, 216, 255)",
    onTertiaryContainer: "rgb(39, 20, 48)",
    error: "rgb(186, 26, 26)",
    onError: "rgb(255, 255, 255)",
    errorContainer: "rgb(255, 218, 214)",
    onErrorContainer: "rgb(65, 0, 2)",
    background: "rgb(253, 252, 255)",
    onBackground: "rgb(26, 28, 30)",
    surface: "rgb(253, 252, 255)",
    onSurface: "rgb(26, 28, 30)",
    surfaceVariant: "rgb(224, 226, 236)",
    onSurfaceVariant: "rgb(67, 71, 78)",
    outline: "rgb(116, 119, 127)",
    outlineVariant: "rgb(195, 198, 207)",
    shadow: "rgb(0, 0, 0)",
    scrim: "rgb(0, 0, 0)",
    inverseSurface: "rgb(47, 48, 51)",
    inverseOnSurface: "rgb(241, 240, 244)",
    inversePrimary: "rgb(165, 200, 255)",
    elevation: {
      level0: "transparent",
      level1: "rgb(240, 244, 251)",
      level2: "rgb(233, 239, 249)",
      level3: "rgb(225, 235, 246)",
      level4: "rgb(223, 233, 245)",
      level5: "rgb(218, 230, 244)",
    },
    surfaceDisabled: "rgba(26, 28, 30, 0.12)",
    onSurfaceDisabled: "rgba(26, 28, 30, 0.38)",
    backdrop: "rgba(45, 49, 56, 0.4)",
  },
};

const darkTheme = {
  dark: true,
  colors: {
    primary: "rgb(165, 200, 255)",
    onPrimary: "rgb(0, 49, 95)",
    primaryContainer: "rgb(0, 71, 134)",
    onPrimaryContainer: "rgb(212, 227, 255)",
    secondary: "rgb(188, 199, 220)",
    onSecondary: "rgb(39, 49, 65)",
    secondaryContainer: "rgb(61, 71, 88)",
    onSecondaryContainer: "rgb(216, 227, 248)",
    tertiary: "rgb(218, 189, 226)",
    onTertiary: "rgb(61, 40, 70)",
    tertiaryContainer: "rgb(85, 63, 93)",
    onTertiaryContainer: "rgb(247, 216, 255)",
    error: "rgb(255, 180, 171)",
    onError: "rgb(105, 0, 5)",
    errorContainer: "rgb(147, 0, 10)",
    onErrorContainer: "rgb(255, 180, 171)",
    background: "rgb(26, 28, 30)",
    onBackground: "rgb(227, 226, 230)",
    surface: "rgb(26, 28, 30)",
    onSurface: "rgb(227, 226, 230)",
    surfaceVariant: "rgb(67, 71, 78)",
    onSurfaceVariant: "rgb(195, 198, 207)",
    outline: "rgb(141, 145, 153)",
    outlineVariant: "rgb(67, 71, 78)",
    shadow: "rgb(0, 0, 0)",
    scrim: "rgb(0, 0, 0)",
    inverseSurface: "rgb(227, 226, 230)",
    inverseOnSurface: "rgb(47, 48, 51)",
    inversePrimary: "rgb(0, 95, 175)",
    elevation: {
      level0: "transparent",
      level1: "rgb(33, 37, 41)",
      level2: "rgb(37, 42, 48)",
      level3: "rgb(41, 47, 55)",
      level4: "rgb(43, 49, 57)",
      level5: "rgb(46, 52, 62)",
    },
    surfaceDisabled: "rgba(227, 226, 230, 0.12)",
    onSurfaceDisabled: "rgba(227, 226, 230, 0.38)",
    backdrop: "rgba(45, 49, 56, 0.4)",
  },
};

SplashScreen.preventAutoHideAsync();

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export default function RootLayout() {
  const session = useAuthStore((state) => state.session);
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    LemonBrush: require("../assets/fonts/LemonBrushArabic-Regular.otf"),
  });
  const currentTheme =
    useThemeStore((state) => state.theme) ??
    Appearance.getColorScheme() ??
    "light";
  Appearance.setColorScheme(currentTheme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const theme = useTheme();
  const [showAnimation, setShowAnimation] = useState(true);
  useReactQueryDevTools(queryClient);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 1000 * 60 * 60 * 24,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            return (
              query.state.status === "success" ||
              (query.state.data != null && Boolean(session))
            );
          },
        },
      }}
    >
      <PaperProvider theme={currentTheme === "light" ? lightTheme : darkTheme}>
        <GestureHandlerRootView>
          {showAnimation ? (
            <AnimationScreen setShowAnimation={setShowAnimation} />
          ) : (
            <Stack
              screenOptions={{
                headerShown: true,
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
                headerTintColor: theme.colors.onPrimary,
                headerRight: () => (
                  <Pressable
                    onPress={() =>
                      setTheme(currentTheme === "light" ? "dark" : "light")
                    }
                  >
                    <Text>Toggle Theme</Text>
                  </Pressable>
                ),
              }}
            >
              <Stack.Screen
                name="(app)"
                options={{
                  headerShown: false,
                  animation: "fade_from_bottom",
                }}
              />
              <Stack.Screen
                name="get-started"
                options={{ title: "Get-Started", headerShown: false }}
              />
              <Stack.Screen
                name="login"
                options={{
                  title: "Login",
                  headerShown: false,
                  animation: "ios_from_right",
                }}
              />
              <Stack.Screen
                name="register"
                options={{
                  title: "Register",
                  headerShown: false,
                  animation: "ios_from_right",
                }}
              />
              <Stack.Screen name="+not-found" options={{ headerShown: true }} />
            </Stack>
          )}
          <StatusBar
            style={currentTheme === "light" ? "dark" : "light"}
            translucent
            hideTransitionAnimation="fade"
          />
          <FlashMessage position="top" />
        </GestureHandlerRootView>
      </PaperProvider>
    </PersistQueryClientProvider>
  );
}
