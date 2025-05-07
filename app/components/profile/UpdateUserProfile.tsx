import { useMutation } from "@tanstack/react-query";
import { type UpdateProfileDTO } from "@/lib/dtos";
import { xiorInstance } from "@/lib/fetcher";
import { type Control, type UseFormHandleSubmit } from "react-hook-form";
import { useCurrentUserProfile } from "@/lib/queries/user";
import { Button, useTheme } from "react-native-paper";
import { View } from "react-native";
import ControlledInput from "../ControlledInput";
import { useI18nContext } from "@/i18n/i18n-react";

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
  const { LL } = useI18nContext();
  const theme = useTheme();
  const currentUserProfile = useCurrentUserProfile();
  const {
    mutateAsync: updateUserProfile,
    isPending: isUpdateUserProfilePending,
  } = useMutation({
    mutationKey: ["userProfile"],
    mutationFn: (data: UpdateProfileDTO) =>
      xiorInstance.patch("/users/me/profile", data).then((res) => res.data),
  });

  const onSubmit = (data: UpdateProfileDTO) => {
    updateUserProfile(data).then(() => currentUserProfile.refetch());
  };

  return (
    <View style={{ gap: 8 }}>
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
        id="bio"
        name="bio"
        placeholder={LL.BIO()}
        keyboardType="default"
        multiline
        maxLength={255}
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
        disabled={!isDirty || isUpdateUserProfilePending}
        loading={isUpdateUserProfilePending}
        compact
      >
        {LL.SAVE_CHANGES()}
      </Button>
    </View>
  );
}
