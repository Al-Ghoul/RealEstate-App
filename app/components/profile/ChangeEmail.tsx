import { type Control, type UseFormHandleSubmit } from "react-hook-form";
import { type UpdateEmailDTO } from "@/lib/dtos";
import { useCurrentUser } from "@/lib/queries/user";
import { useMutation } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import { showMessage } from "react-native-flash-message";
import { XiorError } from "xior";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { Button, useTheme } from "react-native-paper";
import { View } from "react-native";
import ControlledInput from "../ControlledInput";

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
  const currentUser = useCurrentUser();
  const theme = useTheme();
  const updateUserEmail = useMutation({
    mutationKey: ["userEmail"],
    mutationFn: (data: UpdateEmailDTO) => xiorInstance.patch("/users/me", data),
    onSuccess: () => {
      showMessage({
        message: "Updated successfully",
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

  const onSubmit = (data: UpdateEmailDTO) => {
    updateUserEmail.mutateAsync(data).then(() => currentUser.refetch());
  };

  return (
    <View style={{ gap: 8 }}>
      <ControlledInput
        control={control}
        id="email"
        name="email"
        placeholder="Email"
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
            right: 20,
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
              Verify
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
        disabled={!isDirty || updateUserEmail.isPending}
        loading={updateUserEmail.isPending}
      >
        Change Email
      </Button>
    </View>
  );
}
