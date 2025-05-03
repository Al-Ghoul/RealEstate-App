import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { xiorInstance } from "@/lib/fetcher";
import { useMutation } from "@tanstack/react-query";
import { XiorError } from "xior";
import { showMessage } from "react-native-flash-message";
import { registerDTO, type RegisterDTO } from "@/lib/dtos";
import Svg, { Ellipse } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import SocialAuth from "@/components/SocialAuth";
import { View, Text } from "react-native";
import { Button, useTheme } from "react-native-paper";
import ControlledInput from "@/components/ControlledInput";

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
export default function Register() {
  const theme = useTheme();
  const { control: registerControl, handleSubmit: registerHandleSubmit } =
    useForm<RegisterDTO>({
      defaultValues: {
        email: "Abdo.AlGhouul@gmail.com",
        password: "12345678",
        confirmPassword: "12345678",
        firstName: "Abdo",
        lastName: "AlGhouul",
      },
      resolver: zodResolver(registerDTO),
    });

  const { mutate: submitRegister, isPending: isRegisterPending } = useMutation({
    mutationFn: async (data: RegisterDTO) =>
      await xiorInstance.post("/auth/register", data),
    onSuccess: () => {
      showMessage({
        message: "Registered successfully",
        type: "success",
      });
      router.replace("/login");
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

  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.2, {
        duration: 5000,
        easing: Easing.out(Easing.ease),
      }),
      -1,
      true,
    );
  }, [scale]);

  const animatedProps = useAnimatedProps(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ position: "absolute", right: 0 }}>
        <Svg width={252} height={241}>
          <AnimatedEllipse
            animatedProps={animatedProps}
            cx={181}
            cy={22}
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
          justifyContent: "center",
        }}
      >
        <View
          style={{
            marginTop: 16,
            marginHorizontal: 16,
            gap: 8,
          }}
        >
          <ControlledInput
            control={registerControl}
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
            control={registerControl}
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

          <ControlledInput
            control={registerControl}
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm Password"
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

          <ControlledInput
            control={registerControl}
            id="firstName"
            name="firstName"
            placeholder="First Name"
            keyboardType="default"
            style={{
              width: "100%",
              borderWidth: 1,
              borderColor: theme.colors.primary,
              borderRadius: 8,
              padding: 8,
            }}
          />

          <ControlledInput
            control={registerControl}
            id="lastName"
            name="lastName"
            placeholder="Last Name"
            keyboardType="default"
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
            disabled={isRegisterPending}
            loading={isRegisterPending}
            onPress={registerHandleSubmit((data) => submitRegister(data))}
          >
            Register
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
              Already have an account?
            </Text>
            <Text
              style={{
                fontWeight: "bold",
                color: theme.colors.primary,
              }}
              onPress={() => router.back()}
            >
              Login
            </Text>
          </View>
          <SocialAuth />
        </View>
      </View>
    </View>
  );
}
