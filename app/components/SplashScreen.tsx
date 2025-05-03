import LottieView from "lottie-react-native";
import { StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import Animated, { FadeOut } from "react-native-reanimated";

interface AnimatedScreenProps {
  setShowAnimation: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function AnimationScreen({
  setShowAnimation,
}: AnimatedScreenProps) {
  const theme = useTheme();
  return (
    <Animated.View
      exiting={FadeOut.duration(1000)}
      style={[
        styles.animationContainer,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <LottieView
        autoPlay
        loop={false}
        style={{
          width: "50%",
          height: "50%",
        }}
        source={require("../assets/lottie/house-animation.json")}
        onAnimationFinish={() => setShowAnimation(false)}
        onAnimationFailure={(e) => console.error("Error occurred animating", e)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animationContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
});
