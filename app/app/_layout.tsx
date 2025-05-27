import "../i18n/polyfill";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import AnimationScreen from "@/components/SplashScreen";
import { StatusBar } from "expo-status-bar";
import { Appearance, I18nManager, Pressable, Text } from "react-native";
import { useThemeStore } from "@/lib/stores/themeStore";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider, useTheme } from "react-native-paper";
import { darkTheme, lightTheme } from "@/lib/themes";
import { useLocaleStore } from "@/lib/stores/localeStore";
import TypesafeI18n from "@/i18n/i18n-react";
import I18NWrapper from "@/components/I18NWrapper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient } from "@/lib/client";
import { useAuthStore } from "@/lib/stores/authStore";

SplashScreen.preventAutoHideAsync();
I18nManager.allowRTL(false);

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export default function RootLayout() {
  const currentTheme =
    useThemeStore((state) => state.theme) ??
    Appearance.getColorScheme() ??
    "light";
  Appearance.setColorScheme(currentTheme);

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    LemonBrush: require("../assets/fonts/LemonBrushArabic-Regular.otf"),
    Knewave: require("../assets/fonts/Knewave-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <PaperProvider theme={currentTheme === "light" ? lightTheme : darkTheme}>
      <RootLayoutChild />
    </PaperProvider>
  );
}

function RootLayoutChild() {
  const setTheme = useThemeStore((state) => state.setTheme);
  const currentTheme =
    useThemeStore((state) => state.theme) ??
    Appearance.getColorScheme() ??
    "light";
  const theme = useTheme();

  const [showAnimation, setShowAnimation] = useState(true);

  const locale = useLocaleStore((state) => state.locale);

  const session = useAuthStore((state) => state.session);

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
      <TypesafeI18n locale={locale}>
        <I18NWrapper>
          <SafeAreaProvider>
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
                      headerShown: false,
                      title: "Login",
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

                  <Stack.Screen
                    name="reset-password"
                    options={{
                      title: "Reset Password",
                      headerShown: false,
                      animation: "ios_from_right",
                    }}
                  />

                  <Stack.Screen
                    name="+not-found"
                    options={{ headerShown: true }}
                  />
                </Stack>
              )}
              <StatusBar
                style={currentTheme === "light" ? "dark" : "light"}
                translucent
                hideTransitionAnimation="fade"
              />
              <Toaster
                pauseWhenPageIsHidden
                swipeToDismissDirection="left"
                autoWiggleOnUpdate="always"
                richColors
              />
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </I18NWrapper>
      </TypesafeI18n>
    </PersistQueryClientProvider>
  );
}
