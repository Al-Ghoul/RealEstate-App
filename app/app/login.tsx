import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { xiorInstance } from "@/lib/fetcher";
import { useMutation } from "@tanstack/react-query";
import { loginDTO, type LoginDTO } from "@/lib/dtos";
import Svg, { Circle, Ellipse } from "react-native-svg";
import { useAuthStore } from "@/lib/stores/authStore";
import Animated, {
  BounceInLeft,
  BounceInRight,
  BounceOutLeft,
  BounceOutRight,
  Easing,
  FlipInEasyX,
  FlipOutEasyX,
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import SocialAuth from "@/components/SocialAuth";
import { Button, useTheme } from "react-native-paper";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import ControlledInput from "@/components/ControlledInput";
import { useI18nContext } from "@/i18n/i18n-react";
import Feather from "@expo/vector-icons/Feather";
import { toast } from "sonner-native";
import { isXiorError } from "xior";
import {
  KeyboardGestureArea,
  KeyboardAvoidingView,
} from "react-native-keyboard-controller";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function Login() {
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";
  const login = useAuthStore((state) => state.login);
  const theme = useTheme();
  const { control, handleSubmit } = useForm<LoginDTO>({
    defaultValues: {
      email: "Abdo.AlGhouul@gmail.com",
      password: "12345678",
    },
    resolver: zodResolver(loginDTO),
  });

  const { mutateAsync: loginSubmit, isPending } = useMutation({
    mutationFn: (data: LoginDTO) =>
      xiorInstance.post("/auth/login", data).then((res) => res.data),
    onSuccess: (res) => toast.success(res.message),
    onError: (error) => {
      if (isXiorError(error)) {
        if (error.response?.data.requestId) {
          toast.warning(error.response?.data.message, {
            description: LL.REQUEST_ID({
              requestId: error.response?.data.requestId,
            }),
          });
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error(error.message);
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

  const [showPassword, setShowPassword] = useState(false);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <KeyboardGestureArea interpolator="ios" style={{ flex: 1 }}>
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
              justifyContent: "center",
            }}
          >
            <View
              style={{
                position: "absolute",
                right: 0,
              }}
            >
              <Svg height="300" width="200" viewBox="0 0 100 100">
                <AnimatedCircle
                  cx="30"
                  cy="30"
                  r="7"
                  opacity={0.9}
                  fill={theme.colors.primary}
                  animatedProps={floatingProps}
                />
              </Svg>
            </View>

            <View
              style={{
                flex: 1,
                gap: 8,
                justifyContent: "center",
                marginTop: 80,
                marginHorizontal: 16,
              }}
            >
              <KeyboardAvoidingView
                style={{
                  gap: 8,
                  justifyContent: "center",
                }}
                behavior={"padding"}
                keyboardVerticalOffset={85}
              >
                <Animated.View
                  entering={BounceInLeft.delay(550)}
                  exiting={BounceOutRight}
                >
                  <ControlledInput
                    control={control}
                    name="email"
                    id="email"
                    placeholder={LL.EMAIL()}
                    keyboardType="email-address"
                    style={{
                      width: "100%",
                      borderWidth: 1,
                      borderColor: theme.colors.primary,
                      borderRadius: 8,
                      padding: 8,
                    }}
                  />
                </Animated.View>

                <Animated.View
                  entering={BounceInRight.delay(550)}
                  exiting={BounceOutLeft}
                >
                  <ControlledInput
                    control={control}
                    id="password"
                    name="password"
                    placeholder={LL.PASSWORD()}
                    keyboardType="default"
                    secureTextEntry={!showPassword}
                    style={{
                      width: "100%",
                      borderWidth: 1,
                      borderColor: theme.colors.primary,
                      borderRadius: 8,
                      padding: 8,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 4,
                        position: "absolute",
                        right: !forceRTL ? 20 : undefined,
                        left: forceRTL ? 20 : undefined,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                      >
                        <Feather
                          name={showPassword ? "eye-off" : "eye"}
                          size={20}
                          color={theme.colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  </ControlledInput>
                </Animated.View>

                <Animated.View
                  entering={FlipInEasyX.delay(550)}
                  exiting={FlipOutEasyX}
                >
                  <Button
                    style={{
                      marginHorizontal: 24,
                    }}
                    buttonColor={theme.colors.primary}
                    textColor={theme.colors.onPrimary}
                    disabled={isPending}
                    onPress={handleSubmit((data) =>
                      loginSubmit(data).then((res) => {
                        login(res.data as JWTPayload);
                        router.replace("/");
                      }),
                    )}
                    loading={isPending}
                  >
                    {LL.LOGIN()}
                  </Button>
                </Animated.View>
              </KeyboardAvoidingView>

              <View style={{ alignItems: "center" }}>
                <Button
                  style={{
                    marginHorizontal: 24,
                    flexDirection: forceRTL ? "row-reverse" : "row",
                  }}
                  onPress={() => router.push("/reset-password")}
                >
                  <Text
                    style={{
                      color: theme.colors.secondary,
                    }}
                  >
                    {LL.FORGOT_PASSWORD()}{" "}
                  </Text>

                  <Text
                    style={{
                      fontWeight: "bold",
                      color: theme.colors.primary,
                    }}
                  >
                    {LL.RESET()}
                  </Text>
                </Button>

                <Button
                  style={{
                    marginHorizontal: 24,
                    flexDirection: forceRTL ? "row-reverse" : "row",
                  }}
                  onPress={() => router.push("/register")}
                >
                  <Text
                    style={{
                      color: theme.colors.secondary,
                    }}
                  >
                    {LL.DONT_HAVE_ACCOUNT()}{" "}
                  </Text>
                  <Text
                    style={{
                      fontWeight: "bold",
                      color: theme.colors.primary,
                    }}
                  >
                    {LL.REGISTER()}
                  </Text>
                </Button>
              </View>

              <SocialAuth />
            </View>
          </View>
        </KeyboardGestureArea>
      </View>
    </TouchableWithoutFeedback>
  );
}
