import VerificationViews from "../VerificationViews";
import { useMutation } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import { showMessage } from "react-native-flash-message";
import { XiorError } from "xior";
import { useForm } from "react-hook-form";
import { type TrueSheet } from "@lodev09/react-native-true-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyDTO, type VerifyDTO } from "@/lib/dtos";
import React from "react";
import Octicons from "@expo/vector-icons/Octicons";
import { View } from "react-native";
import { Button, useTheme } from "react-native-paper";
import ControlledInput from "../ControlledInput";

interface EmailVerificationProps {
  sheet: React.RefObject<TrueSheet>;
}

export default function EmailVerification({ sheet }: EmailVerificationProps) {
  const theme = useTheme();
  const requestEmailVerificationCode = useMutation({
    mutationKey: ["requestEmailVerificationCode"],
    mutationFn: () =>
      xiorInstance.post("/auth/me/request-email-verification-code"),
    onSuccess: () => {
      showMessage({
        message: "Verification code sent successfully",
        type: "success",
      });
    },
    onError: (error) => {
      if (error instanceof XiorError) {
        showMessage({
          message: error.response?.data.message || "An error occurred",
          type: "warning",
        });
      } else {
        showMessage({
          message: "An error occurred",
          description: error.message,
          type: "danger",
        });
      }
    },
  });

  const {
    control: emailVerificationControl,
    handleSubmit: handleEmailVerificationSubmit,
    setError: setEmailVerificationError,
  } = useForm<VerifyDTO>({
    resolver: zodResolver(verifyDTO),
  });
  const verifyEmail = useMutation({
    mutationKey: ["verifyEmail"],
    mutationFn: (data: VerifyDTO) => xiorInstance.post("/auth/me/verify", data),
    onSuccess: () => {
      showMessage({
        message: "Email was verified successfully",
        type: "success",
      });
    },
    onError: (error) => {
      if (error instanceof XiorError) {
        if (
          typeof error.response?.data === "object" &&
          "errors" in error.response?.data
        ) {
          error.response?.data.errors.map((error: { message: string }) =>
            setEmailVerificationError("root", { message: error.message }),
          );
        } else {
          showMessage({
            message: error.response?.data.message || "An error occurred",
            type: "warning",
          });
        }
      } else {
        showMessage({
          message: "An error occurred",
          description: error.message,
          type: "danger",
        });
      }
    },
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
              requestEmailVerificationCode.mutate();
              switchView("view2");
            }}
          >
            Send Code
          </Button>

          <Button mode="outlined" onPress={() => sheet.current?.dismiss()}>
            Cancel
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
                right: 20,
              }}
            >
              <Octicons name="number" size={24} color={theme.colors.primary} />
            </View>
          </ControlledInput>

          <View
            style={{
              flexDirection: "row",
              marginHorizontal: "auto",
              gap: 8,
            }}
          >
            <Button
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              onPress={handleEmailVerificationSubmit((data) =>
                verifyEmail
                  .mutateAsync(data)
                  .then(() => sheet.current?.dismiss()),
              )}
            >
              Verify
            </Button>
            <Button
              compact
              mode="outlined"
              onPress={() => sheet.current?.dismiss()}
            >
              Cancel
            </Button>
          </View>
        </View>
      )}
    />
  );
}
