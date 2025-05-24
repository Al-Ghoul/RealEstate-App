import { type Control, type UseFormHandleSubmit } from "react-hook-form";
import { type UpdateEmailDTO } from "@/lib/dtos";
import { useCurrentUser } from "@/lib/queries/user";
import { useMutation } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Button, useTheme } from "react-native-paper";
import { View } from "react-native";
import ControlledInput from "../ControlledInput";
import { useI18nContext } from "@/i18n/i18n-react";
import { toast } from "sonner-native";
import { XiorError } from "xior";

interface ChangeEmailProps {
  sheet: React.RefObject<TrueSheet>;
  control: Control<UpdateEmailDTO>;
  handleSubmit: UseFormHandleSubmit<UpdateEmailDTO>;
  isDirty: boolean;
}

export default function ChangeEmail({
  sheet,
  control,
  handleSubmit,
  isDirty,
}: ChangeEmailProps) {
  const theme = useTheme();
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";
  const currentUser = useCurrentUser();
  const { mutateAsync: updateUserEmail, isPending: isUpdateUserEmailPending } =
    useMutation({
      mutationKey: ["userEmail"],
      mutationFn: (data: UpdateEmailDTO) =>
        xiorInstance.patch("/users/me", data).then((res) => res.data),
      onSuccess: (res) => toast.success(res.message),
      onError: (error) => {
        if (error instanceof XiorError) {
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

  const onSubmit = (data: UpdateEmailDTO) => {
    updateUserEmail(data).then(() => currentUser.refetch());
  };

  return (
    <View style={{ gap: 8 }}>
      <ControlledInput
        control={control}
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
      >
        <View
          style={{
            position: "absolute",
            left: forceRTL ? 20 : undefined,
            right: !forceRTL ? 20 : undefined,
          }}
        >
          {!currentUser.data?.emailVerified || true ? (
            <Button
              onPress={() => sheet.current?.present()}
              compact
              disabled={
                currentUser.isLoading || !!currentUser.data?.emailVerified
              }
            >
              {LL.VERIFY()}
            </Button>
          ) : null}
        </View>
      </ControlledInput>

      <Button
        style={{
          marginHorizontal: 48,
        }}
        compact
        buttonColor={theme.colors.primaryContainer}
        onPress={handleSubmit(onSubmit)}
        disabled={!isDirty || isUpdateUserEmailPending}
        loading={isUpdateUserEmailPending}
      >
        {LL.CHANGE_EMAIL()}
      </Button>
    </View>
  );
}
