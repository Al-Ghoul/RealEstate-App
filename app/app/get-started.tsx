import ImagesCarousel from "@/components/ImagesCarousel";
import { router } from "expo-router";
import * as React from "react";
import { Pressable, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Ellipse } from "react-native-svg";
import { useThemeContextValues } from "@/components/themes";

export default function GetStarted() {
  const { theme } = useThemeContextValues();

  return (
    <SafeAreaView className="flex-1 bg-secondary">
      <View className="absolute z-10 right-0">
        <Svg width={252} height={241}>
          <Ellipse
            cx={181}
            cy={33}
            opacity={0.6}
            fill={theme === "light" ? "#7dd1fc" : "#0c496e"}
            rx={181}
            ry={178}
          />
        </Svg>
      </View>

      <View className="flex-1  justify-center">
        <Text className="text-center text-primary mb-16 text-4xl z-20">
          Welcome to RealEstate
        </Text>
        <ImagesCarousel />
        <Pressable
          className="bg-outstand w-[80%] self-center mt-16 h-16 rounded-xl"
          onPress={() => router.push("/login")}
        >
          <Text className="text-center my-auto text-primary">Get Started</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
