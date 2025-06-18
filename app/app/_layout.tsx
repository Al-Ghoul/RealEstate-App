import "../i18n/polyfill";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import AnimationScreen from "@/components/SplashScreen";
import { StatusBar } from "expo-status-bar";
import { Appearance, I18nManager, View } from "react-native";
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
import { useReactQueryDevTools } from "@dev-plugins/react-query";
import { KeyboardProvider } from "react-native-keyboard-controller";
import ThemeToggle from "@/components/ThemeToggle";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";

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

  const session = useAuthStore((state) => state.session);
  const locale = useLocaleStore((state) => state.locale);

  useReactQueryDevTools(queryClient);

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
      <ActionSheetProvider>
        <TypesafeI18n locale={locale}>
          <I18NWrapper>
            <SafeAreaProvider>
              <KeyboardProvider>
                <GestureHandlerRootView>
                  {showAnimation ? (
                    <AnimationScreen setShowAnimation={setShowAnimation} />
                  ) : (
                    <Stack
                      screenOptions={{
                        animation: "slide_from_right",
                        headerShown: false,
                        headerStyle: {
                          backgroundColor: theme.colors.primary,
                        },
                        headerTintColor: theme.colors.onPrimary,
                        headerRight: () => (
                          <View style={{ margin: 16 }}>
                            <ThemeToggle
                              setTheme={setTheme}
                              currentTheme={currentTheme}
                            />
                          </View>
                        ),
                      }}
                    >
                      <Stack.Screen name="(app)" options={{ title: "Home" }} />

                      <Stack.Screen
                        name="get-started"
                        options={{ title: "Get-Started" }}
                      />

                      <Stack.Screen
                        name="login"
                        options={{
                          title: "Login",
                        }}
                      />

                      <Stack.Screen
                        name="register"
                        options={{
                          title: "Register",
                        }}
                      />

                      <Stack.Screen
                        name="reset-password"
                        options={{
                          title: "Reset Password",
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
              </KeyboardProvider>
            </SafeAreaProvider>
          </I18NWrapper>
        </TypesafeI18n>
      </ActionSheetProvider>
    </PersistQueryClientProvider>
  );
}
