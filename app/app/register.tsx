import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { xiorInstance } from "@/lib/fetcher";
import { useMutation } from "@tanstack/react-query";
import { registerDTO, type RegisterDTO } from "@/lib/dtos";
import Svg, { Ellipse } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import SocialAuth from "@/components/SocialAuth";
import { View, Text, TouchableOpacity } from "react-native";
import { Button, Checkbox, Tooltip, useTheme } from "react-native-paper";
import ControlledInput from "@/components/ControlledInput";
import { useI18nContext } from "@/i18n/i18n-react";
import Feather from "@expo/vector-icons/Feather";

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
    mutationFn: (data: RegisterDTO & { role: string }) =>
      xiorInstance.post("/auth/register", data).then((res) => res.data),
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
            marginTop: 96,
            marginHorizontal: 16,
            gap: 8,
          }}
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
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            </View>
          </ControlledInput>

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

          <View style={{ marginHorizontal: "auto" }}>
            <Tooltip title={LL.AGENT_DESCRIPTION()} enterTouchDelay={0}>
              <View
                style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
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
                role: registerAsAnAgent ? "agent" : "client",
              }).then(() => router.replace("/login")),
            )}
          >
            {LL.REGISTER()}
          </Button>

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
      </View>
    </View>
  );
}
