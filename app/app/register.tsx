import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { xiorInstance } from "@/lib/fetcher";
import { useMutation } from "@tanstack/react-query";
import { registerDTO, type RegisterDTO } from "@/lib/dtos";
import Svg, { Ellipse } from "react-native-svg";
import Animated, {
  Easing,
  BounceIn,
  BounceOut,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  FlipInEasyX,
  FlipOutEasyX,
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import SocialAuth from "@/components/SocialAuth";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Button, Checkbox, Tooltip, useTheme } from "react-native-paper";
import ControlledInput from "@/components/ControlledInput";
import { useI18nContext } from "@/i18n/i18n-react";
import Feather from "@expo/vector-icons/Feather";
import { toast } from "sonner-native";
import { isXiorError } from "xior";
import {
  KeyboardGestureArea,
  KeyboardAvoidingView,
} from "react-native-keyboard-controller";

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
export default function Register() {
  const theme = useTheme();
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";
  const { control, handleSubmit } = useForm<RegisterDTO>({
    defaultValues: {
      email: "Abdo.AlGhouul@gmail.com",
      password: "12345678",
      confirmPassword: "12345678",
      firstName: "Abdo",
      lastName: "AlGhoul",
    },
    resolver: zodResolver(registerDTO),
  });
  const [registerAsAnAgent, setRegisterAsAnAgent] = useState(false);

  const { mutateAsync: registerSubmit, isPending } = useMutation({
    mutationFn: (data: RegisterDTO & { role: Role }) =>
      xiorInstance.post("/auth/register", data).then((res) => res.data),
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

  const [showPassword, setShowPassword] = useState(false);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <KeyboardGestureArea interpolator="ios" style={{ flex: 1 }}>
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
              marginHorizontal: 16,
              marginTop: 48,
              gap: 8,
              justifyContent: "center",
            }}
          >
            <KeyboardAvoidingView
              style={{
                gap: 8,
                justifyContent: "center",
              }}
              behavior={"padding"}
              keyboardVerticalOffset={55}
            >
              <Animated.View entering={BounceIn.delay(510)} exiting={BounceOut}>
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

              <Animated.View entering={BounceIn.delay(520)} exiting={BounceOut}>
                <ControlledInput
                  control={control}
                  id="firstName"
                  name="firstName"
                  placeholder={LL.FIRST_NAME()}
                  keyboardType="default"
                  style={{
                    width: "100%",
                    borderWidth: 1,
                    borderColor: theme.colors.primary,
                    borderRadius: 8,
                    padding: 8,
                  }}
                />
              </Animated.View>

              <Animated.View entering={BounceIn.delay(530)} exiting={BounceOut}>
                <ControlledInput
                  control={control}
                  id="lastName"
                  name="lastName"
                  placeholder={LL.LAST_NAME()}
                  keyboardType="default"
                  style={{
                    width: "100%",
                    borderWidth: 1,
                    borderColor: theme.colors.primary,
                    borderRadius: 8,
                    padding: 8,
                  }}
                />
              </Animated.View>

              <Animated.View entering={BounceIn.delay(520)} exiting={BounceOut}>
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

              <Animated.View entering={BounceIn.delay(540)} exiting={BounceOut}>
                <ControlledInput
                  control={control}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder={LL.CONFIRM_PASSWORD()}
                  keyboardType="default"
                  secureTextEntry={!showPassword}
                  style={{
                    width: "100%",
                    borderWidth: 1,
                    borderColor: theme.colors.primary,
                    borderRadius: 8,
                    padding: 8,
                  }}
                />
              </Animated.View>

              <View style={{ alignSelf: "center" }}>
                <Tooltip title={LL.AGENT_DESCRIPTION()} enterTouchDelay={0}>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <Checkbox
                      status={registerAsAnAgent ? "checked" : "unchecked"}
                      onPress={() => setRegisterAsAnAgent(!registerAsAnAgent)}
                    />
                    <Text
                      style={{
                        color: theme.colors.primary,
                      }}
                    >
                      {LL.REGISTER_AS_AN_AGENT()}
                    </Text>
                  </View>
                </Tooltip>
              </View>

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
                  loading={isPending}
                  onPress={handleSubmit((data) =>
                    registerSubmit({
                      ...data,
                      role: registerAsAnAgent ? "AGENT" : "CLIENT",
                    }).then(() => router.replace("/login")),
                  )}
                >
                  {LL.REGISTER()}
                </Button>
              </Animated.View>
            </KeyboardAvoidingView>

            <Button
              style={{
                flexDirection: forceRTL ? "row-reverse" : "row",
                alignSelf: "center",
              }}
              onPress={() => router.back()}
            >
              <Text
                style={{
                  color: theme.colors.secondary,
                }}
              >
                {LL.ALREADY_HAVE_AN_ACCOUNT()}{" "}
              </Text>
              <Text
                style={{
                  fontWeight: "bold",
                  color: theme.colors.primary,
                }}
              >
                {LL.LOGIN()}
              </Text>
            </Button>

            <SocialAuth />
          </View>
        </KeyboardGestureArea>
      </View>
    </TouchableWithoutFeedback>
  );
}
