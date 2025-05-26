import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { xiorInstance } from "@/lib/fetcher";
import { useMutation } from "@tanstack/react-query";
import {
  requestPasswordResetDTO,
  resetPasswordDTO,
  type ResetPasswordDTO,
  type RequestPasswordResetDTO,
} from "@/lib/dtos";
import Svg, { Circle, Ellipse } from "react-native-svg";
import Animated, {
  Easing,
  FadeInUp,
  FadeOutDown,
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import { Button, Modal, useTheme } from "react-native-paper";
import { TouchableOpacity, View } from "react-native";
import ControlledInput from "@/components/ControlledInput";
import { useI18nContext } from "@/i18n/i18n-react";
import Feather from "@expo/vector-icons/Feather";
import { toast } from "sonner-native";
import { isXiorError } from "xior";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ResetPassword() {
  const theme = useTheme();
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";
  const {
    control: requestResetControl,
    handleSubmit: requestResetHandleSubmit,
  } = useForm<RequestPasswordResetDTO>({
    defaultValues: {
      email: "Abdo.AlGhouul@gmail.com",
    },
    resolver: zodResolver(requestPasswordResetDTO),
  });

  const { mutate: requestPasswordReset, isPending: isRequestResetPending } =
    useMutation({
      mutationFn: (data: RequestPasswordResetDTO) =>
        xiorInstance
          .post("/auth/request-password-reset", data)
          .then((res) => res.data),
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

  const { control: resetControl, handleSubmit: resetHandleSubmit } =
    useForm<ResetPasswordDTO>({
      resolver: zodResolver(resetPasswordDTO),
    });

  const { mutate: resetPassword, isPending: isResetPending } = useMutation({
    mutationFn: (data: ResetPasswordDTO) =>
      xiorInstance.post("/auth/password-reset", data).then((res) => res.data),
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

  const [visible, setVisible] = useState(false);
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const [showPassword, setShowPassword] = useState(false);

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
          control={requestResetControl}
          id="email"
          name="email"
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

        <Button
          style={{
            marginHorizontal: 24,
          }}
          buttonColor={theme.colors.primary}
          textColor={theme.colors.onPrimary}
          disabled={isRequestResetPending}
          onPress={requestResetHandleSubmit((data) =>
            requestPasswordReset(data),
          )}
          loading={isRequestResetPending}
        >
          {LL.SEND_PASSWORD_RESET_CODE()}
        </Button>

        <Button style={{ marginTop: 30 }} onPress={showModal}>
          {LL.ALREADY_RECEIVED_CODE()}
        </Button>
      </View>

      <Modal
        visible={visible}
        onDismiss={hideModal}
        contentContainerStyle={{
          flex: 1,
          backgroundColor: theme.colors.secondaryContainer,
          marginTop: "20%",
          marginHorizontal: "1%",
          borderRadius: 8,
        }}
      >
        <View style={{ flex: 1, margin: 16, justifyContent: "center" }}>
          <Animated.View
            entering={FadeInUp}
            exiting={FadeOutDown}
            style={{
              gap: 8,
            }}
          >
            <ControlledInput
              control={resetControl}
              id="code"
              name="code"
              placeholder={LL.CODE()}
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
              control={resetControl}
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

            <ControlledInput
              control={resetControl}
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

            <Button
              style={{
                marginHorizontal: 24,
              }}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              disabled={isResetPending}
              onPress={resetHandleSubmit((data) => resetPassword(data))}
              loading={isResetPending}
            >
              {LL.SET_PASSWORD()}
            </Button>

            <Button
              style={{
                marginHorizontal: 24,
              }}
              onPress={hideModal}
            >
              {LL.CANCEL()}
            </Button>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
