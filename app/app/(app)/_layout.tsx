import { Redirect, router, Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { addAuthHeader, xiorInstance } from "@/lib/fetcher";
import { XiorResponse } from "xior";
import errorRetry from "xior/plugins/error-retry";
import setupTokenRefresh from "xior/plugins/token-refresh";
import LottieView from "lottie-react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, TouchableOpacity, View, Text } from "react-native";
import { useColorScheme } from "nativewind";
import { Image } from "expo-image";
import { useCurrentUser } from "@/lib/queries/useCurrentUser";

export default function TabLayout() {
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(true);
  const { toggleColorScheme, colorScheme } = useColorScheme();
  const currentUser = useCurrentUser();

  useEffect(() => {
    if (session) addAuthHeader(session.accessToken);

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
        session?.accessToken &&
          response?.status &&
          [401, 403].includes(response.status),
      );
    }

    const handle = xiorInstance.plugins.use(
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
            refreshToken: session?.refreshToken,
          });
          if (status === 200 && data) {
            login(data.data);
            addAuthHeader(data.data.accessToken);
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

    setIsLoading(false);

    return () => {
      xiorInstance.plugins.eject(handle);
      xiorInstance.interceptors.request.clear();
      xiorInstance.interceptors.response.clear();
    };
  }, [session, login, logout]);

  if (!session) return <Redirect href="/get-started" />;

  if (isLoading) {
    return (
      <LottieView
        autoPlay
        style={{
          width: "50%",
          height: "50%",
          marginHorizontal: "auto",
          marginVertical: "auto",
        }}
        source={require("../../assets/lottie/loading.json")}
        onAnimationFailure={(e) => console.error("Error occurred animating", e)}
      />
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAllowFontScaling: true,
        headerStyle: {
          backgroundColor: colorScheme === "light" ? "#fff" : "#000",
        },
        headerShadowVisible: false,
        headerTintColor: colorScheme === "light" ? "#000" : "#fff",
        tabBarActiveTintColor: colorScheme === "light" ? "#000" : "#fff",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: colorScheme === "light" ? "#fff" : "#000",
        },
        tabBarShowLabel: true,
        headerRight: () => (
          <Pressable onPress={toggleColorScheme}>
            <Text className="dark:text-white text-black">Toggle Theme</Text>
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 size={28} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(user)/profile"
        options={{
          title: "Profile",
          headerTitleAlign: "center",
          headerRight: () => (
            <View className="mr-12">
              <TouchableOpacity
                className="dark:bg-gray-900 bg-gray-300 items-center justify-center w-10 h-10 rounded-full"
                onPress={() =>
                  router.push("/edit-profile", { withAnchor: true })
                }
              >
                <Ionicons
                  name="settings"
                  size={18}
                  color={colorScheme === "light" ? "#000" : "#fff"}
                />
              </TouchableOpacity>
            </View>
          ),

          tabBarIcon: ({ focused }) => (
            <View className="border-2 dark:border-white border-black rounded-full  justify-center">
              <Image
                style={{
                  width: focused ? 20 : 28,
                  height: focused ? 20 : 28,
                  borderRadius: 50,
                }}
                source={currentUser.data?.image}
                transition={500}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="(user)/edit-profile"
        options={{
          title: "Edit Profile",
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
    </Tabs>
  );
}
