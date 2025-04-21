import React from "react";
import { View, Text, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface VerificationViewsProps {
  view1: (props: { switchView: (view: string) => void }) => React.ReactNode;
  view2: (props: { switchView: (view: string) => void }) => React.ReactNode;
}
const ViewTransition = ({ view1, view2 }: VerificationViewsProps) => {
  const offset = useSharedValue(0);
  const width = Dimensions.get("window").width;

  const switchView = (viewName: string) => {
    offset.value = withTiming(viewName === "view2" ? 1 : 0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  };

  const view1Style = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: offset.value * -width,
        },
      ],
      opacity: 1 - offset.value,
    };
  });

  const view2Style = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: (1 - offset.value) * width,
        },
      ],
      opacity: offset.value,
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };
  });

  return (
    <View className="flex-1 mt-4 dark:bg-white bg-black">
      <Animated.View style={view1Style} className="flex-1">
        <Text className="dark:text-black text-white text-2xl mx-auto">
          Email is not verified
        </Text>
        {view1({ switchView })}
      </Animated.View>

      <Animated.View style={view2Style} className="flex-1">
        {view2({ switchView })}
      </Animated.View>
    </View>
  );
};

export default ViewTransition;
