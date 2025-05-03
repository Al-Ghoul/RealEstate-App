import { useMutation } from "@tanstack/react-query";
import { type UpdateProfileDTO } from "@/lib/dtos";
import { xiorInstance } from "@/lib/fetcher";
import { showMessage } from "react-native-flash-message";
import { XiorError } from "xior";
import { type Control, type UseFormHandleSubmit } from "react-hook-form";
import { useCurrentUserProfile } from "@/lib/queries/user";
import { Button, useTheme } from "react-native-paper";
import { View } from "react-native";
import ControlledInput from "../ControlledInput";

interface UpdateUserProfileProps {
  control: Control<UpdateProfileDTO>;
  handleSubmit: UseFormHandleSubmit<UpdateProfileDTO>;
  isDirty: boolean;
}

export default function UpdateUserProfile({
  control,
  handleSubmit,
  isDirty,
}: UpdateUserProfileProps) {
  const theme = useTheme();
  const currentUserProfile = useCurrentUserProfile();
  const updateUserProfile = useMutation({
    mutationKey: ["userProfile"],
    mutationFn: (data: UpdateProfileDTO) =>
      xiorInstance.patch("/users/me/profile", data),
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

  const onSubmit = (data: UpdateProfileDTO) => {
    updateUserProfile
      .mutateAsync(data)
      .then(() => currentUserProfile.refetch());
  };

  return (
    <View style={{ gap: 8 }}>
      <ControlledInput
        control={control}
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
        control={control}
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

      <ControlledInput
        control={control}
        id="bio"
        name="bio"
        placeholder="Bio"
        keyboardType="default"
        multiline
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
          marginHorizontal: 48,
        }}
        onPress={handleSubmit(onSubmit)}
        buttonColor={theme.colors.primaryContainer}
        disabled={!isDirty || updateUserProfile.isPending}
        loading={updateUserProfile.isPending}
        compact
      >
        Save Changes
      </Button>
    </View>
  );
}
