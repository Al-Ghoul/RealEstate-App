import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { xiorInstance } from "@/lib/fetcher";
import { useMutation } from "@tanstack/react-query";
import { XiorError } from "xior";
import { showMessage } from "react-native-flash-message";
import { loginDTO, type LoginDTO } from "@/lib/dtos";
import Svg, { Circle, Ellipse } from "react-native-svg";
import { useAuthStore } from "@/lib/stores/authStore";
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import SocialAuth from "@/components/SocialAuth";
import { Button, useTheme } from "react-native-paper";
import { View, Text } from "react-native";
import ControlledInput from "@/components/ControlledInput";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function Login() {
  const login = useAuthStore((state) => state.login);
  const theme = useTheme();
  const { control: loginControl, handleSubmit: loginHandleSubmit } =
    useForm<LoginDTO>({
      defaultValues: {
        email: "Abdo.AlGhouul@gmail.com",
        password: "12345678",
      },
      resolver: zodResolver(loginDTO),
    });

  const { mutate: submitLogin, isPending: isLoginPending } = useMutation({
    mutationFn: async (data: LoginDTO) =>
      await xiorInstance.post("/auth/login", data),
    onSuccess: (res) => {
      showMessage({
        message: "Logged in successfully",
        type: "success",
      });
      const tokens = res.data.data as JWTPayload;
      login(tokens);
      router.replace("/");
    },
    onError: (error) => {
      if (error instanceof XiorError) {
        showMessage({
          message: error.response?.data.message,
          type: "warning",
          style: {
            backgroundColor: theme.colors.secondaryContainer,
          },
        });
      } else {
        showMessage({
          message: "An error occurred",
          description: error.message,
          type: "danger",
          style: {
            backgroundColor: theme.colors.errorContainer,
          },
        });
      }
    },
  });

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: 4000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [progress]);

  const floatingProps = useAnimatedProps(() => {
    const translateY = interpolate(progress.value, [0, 1], [-2, 2], "extend");

    return {
      transform: [{ translateY }],
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          position: "absolute",
        }}
      >
        <Svg width={252} height={241}>
          <Ellipse
            cx={71}
            cy={63}
            opacity={0.9}
            fill={theme.colors.primary}
            rx={181}
            ry={178}
          />
        </Svg>
      </View>
      <View
        style={{
          flex: 1,
          marginHorizontal: 16,
          justifyContent: "center",
          gap: 8,
        }}
      >
        <View
          style={{
            position: "absolute",
            right: 0,
          }}
        >
          <Svg height="300" width="300" viewBox="0 0 100 100">
            <AnimatedCircle
              cx="20"
              cy="20"
              r="5"
              opacity={0.9}
              fill={theme.colors.primary}
              animatedProps={floatingProps}
            />
          </Svg>
        </View>

        <ControlledInput
          control={loginControl}
          name="email"
          id="email"
          placeholder="Email"
          keyboardType="email-address"
          style={{
            width: "100%",
            borderWidth: 1,
            borderColor: theme.colors.primary,
            borderRadius: 8,
            padding: 8,
          }}
        />

        <ControlledInput
          control={loginControl}
          id="password"
          name="password"
          placeholder="Password"
          keyboardType="default"
          secureTextEntry
          style={{
            width: "100%",
            borderWidth: 1,
            borderColor: theme.colors.primary,
            borderRadius: 8,
            padding: 8,
          }}
        />

        <Button
          style={{
            marginHorizontal: 24,
          }}
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
          disabled={isLoginPending}
          onPress={loginHandleSubmit((data) => submitLogin(data))}
          loading={isLoginPending}
        >
          Login
        </Button>

        <View
          style={{
            flexDirection: "row",
            alignSelf: "center",
            gap: 4,
          }}
        >
          <Text
            style={{
              color: theme.colors.secondary,
            }}
          >
            Don't have an account?
          </Text>
          <Text
            style={{
              fontWeight: "bold",
              color: theme.colors.primary,
            }}
            onPress={() => router.push("/register")}
          >
            Register
          </Text>
        </View>

        <SocialAuth />
      </View>
    </View>
  );
}
