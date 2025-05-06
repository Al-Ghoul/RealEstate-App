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
import { darkTheme, lightTheme } from "@/lib/themes";

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
