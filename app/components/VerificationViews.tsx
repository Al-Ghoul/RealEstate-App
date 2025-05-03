import React from "react";
import { Dimensions, View, Text } from "react-native";
import { useTheme } from "react-native-paper";
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
  const theme = useTheme();
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
    <View
      style={{
        backgroundColor: theme.colors.background,
        marginTop: 8,
      }}
    >
      <Animated.View style={view1Style}>
        <Text
          style={{
            textAlign: "center",
            fontSize: 18,
            color: theme.colors.secondary,
          }}
        >
          Email is not verified
        </Text>
        {view1({ switchView })}
      </Animated.View>

      <Animated.View style={view2Style}>{view2({ switchView })}</Animated.View>
    </View>
  );
};

export default ViewTransition;
