import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { useSession } from "@/components/AuthContext";
import LottieView from "lottie-react-native";

export default function TabLayout() {
  const { session, isLoading } = useSession();

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

  if (!session) return <Redirect href="/get-started" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
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
