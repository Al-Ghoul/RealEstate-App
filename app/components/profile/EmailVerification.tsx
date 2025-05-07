import VerificationViews from "../VerificationViews";
import { useMutation } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import { useForm } from "react-hook-form";
import { type TrueSheet } from "@lodev09/react-native-true-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyDTO, type VerifyDTO } from "@/lib/dtos";
import React from "react";
import Octicons from "@expo/vector-icons/Octicons";
import { View } from "react-native";
import { Button, useTheme } from "react-native-paper";
import ControlledInput from "../ControlledInput";
import { useI18nContext } from "@/i18n/i18n-react";

interface EmailVerificationProps {
  sheet: React.RefObject<TrueSheet>;
}

export default function EmailVerification({ sheet }: EmailVerificationProps) {
  const theme = useTheme();
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";
  const {
    mutate: requestEmailVerificationCode,
    isPending: isRequestEmailVerificationCodePending,
  } = useMutation({
    mutationKey: ["requestEmailVerificationCode"],
    mutationFn: () =>
      xiorInstance
        .post("/auth/me/request-email-verification-code")
        .then((res) => res.data),
  });

  const {
    control: emailVerificationControl,
    handleSubmit: handleEmailVerificationSubmit,
  } = useForm<VerifyDTO>({
    resolver: zodResolver(verifyDTO),
  });
  const { mutateAsync: verifyEmail, isPending: isVerifyEmailPending } =
    useMutation({
      mutationKey: ["verifyEmail"],
      mutationFn: (data: VerifyDTO) =>
        xiorInstance.post("/auth/me/verify", data).then((res) => res.data),
    });

  return (
    <VerificationViews
      view1={({ switchView }) => (
        <View
          style={{
            flexDirection: "row",
            marginHorizontal: "auto",
            marginTop: 24,
            gap: 8,
          }}
        >
          <Button
            buttonColor={theme.colors.primary}
            textColor={theme.colors.onPrimary}
            onPress={() => {
              requestEmailVerificationCode();
              switchView("view2");
            }}
            disabled={isRequestEmailVerificationCodePending}
            loading={isRequestEmailVerificationCodePending}
          >
            {LL.SEND_VERIFICATION_CODE()}
          </Button>

          <Button mode="outlined" onPress={() => sheet.current?.dismiss()}>
            {LL.CANCEL()}
          </Button>
        </View>
      )}
      view2={() => (
        <View
          style={{
            marginHorizontal: 40,
            gap: 8,
          }}
        >
          <ControlledInput
            control={emailVerificationControl}
            name="code"
            id="code"
            placeholder="Verification Code"
            keyboardType="default"
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
                left: forceRTL ? 20 : undefined,
                right: !forceRTL ? 20 : undefined,
              }}
            >
              <Octicons name="number" size={24} color={theme.colors.primary} />
            </View>
          </ControlledInput>

          <View
            style={{
              flexDirection: forceRTL ? "row-reverse" : "row",
              marginHorizontal: "auto",
              gap: 8,
            }}
          >
            <Button
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              onPress={handleEmailVerificationSubmit((data) =>
                verifyEmail(data).then(() => sheet.current?.dismiss()),
              )}
              disabled={isVerifyEmailPending}
              loading={isVerifyEmailPending}
            >
              {LL.VERIFY()}
            </Button>
            <Button
              compact
              mode="outlined"
              onPress={() => sheet.current?.dismiss()}
            >
              {LL.CANCEL()}
            </Button>
          </View>
        </View>
      )}
    />
  );
}
