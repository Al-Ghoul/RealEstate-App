import { Redirect, Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { useAuthStore } from "@/lib/stores/authStore";
import { addAuthHeader, xiorInstance } from "@/lib/fetcher";
import { XiorResponse } from "xior";
import errorRetry from "xior/plugins/error-retry";
import setupTokenRefresh from "xior/plugins/token-refresh";
import LottieView from "lottie-react-native";

export default function TabLayout() {
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(true);

  if (!session) return <Redirect href="/get-started" />;

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

    xiorInstance.plugins.use(
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
            login(data);
            xiorInstance.interceptors.request.clear();
            addAuthHeader(data.accessToken);
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
      xiorInstance.interceptors.request.clear();
      xiorInstance.interceptors.response.clear();
    };
  }, [session]);

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
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Index",
        }}
      />
    </Tabs>
  );
}
