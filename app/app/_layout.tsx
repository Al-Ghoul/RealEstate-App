import "@/global.css";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import AnimationScreen from "@/components/AnimationScreen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FlashMessage from "react-native-flash-message";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Pressable, Text } from "react-native";
import { useColorScheme } from "nativewind";

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    LemonBrush: require("../assets/fonts/LemonBrushArabic-Regular.otf"),
  });
  const [showAnimation, setShowAnimation] = useState(true);
  const { toggleColorScheme, colorScheme } = useColorScheme();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        {showAnimation ? (
          <AnimationScreen setShowAnimation={setShowAnimation} />
        ) : (
          <Stack
            screenOptions={{
              headerShown: true,
              headerStyle: {
                backgroundColor: colorScheme === "light" ? "#fff" : "#000",
              },
              headerTintColor: colorScheme === "light" ? "black" : "white",
              headerRight: () => (
                <Pressable onPress={toggleColorScheme}>
                  <Text className="dark:text-white text-black">
                    Toggle Theme
                  </Text>
                </Pressable>
              ),
            }}
          >
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
            <Stack.Screen
              name="get-started"
              options={{ title: "Get-Started", headerShown: false }}
            />
            <Stack.Screen
              name="login"
              options={{ title: "Login", headerShown: false }}
            />
            <Stack.Screen
              name="register"
              options={{ title: "Register", headerShown: false }}
            />
            <Stack.Screen name="+not-found" options={{ headerShown: true }} />
          </Stack>
        )}
        <StatusBar style="auto" translucent hideTransitionAnimation="fade" />
        <FlashMessage position="top" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
