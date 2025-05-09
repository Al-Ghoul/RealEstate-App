import { useMutation } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordDTO, type ChangePasswordDTO } from "@/lib/dtos";
import { TouchableOpacity, Alert, BackHandler, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useCallback, useEffect, useState } from "react";
import { router, Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import WaveDecoratedView from "@/components/WaveDecoratedView";
import { Button, useTheme } from "react-native-paper";
import ControlledInput from "@/components/ControlledInput";
import { useI18nContext } from "@/i18n/i18n-react";

export default function ChangePassword() {
  const theme = useTheme();
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const {
    mutateAsync: updateUserPassword,
    isPending: isUpdateUserPasswordPending,
  } = useMutation({
    mutationKey: ["changePassword"],
    mutationFn: (data: ChangePasswordDTO) =>
      xiorInstance
        .post("/auth/me/change-password", data)
        .then((res) => res.data),
  });
  const {
    control,
    handleSubmit,
    formState: { isDirty },
    reset,
  } = useForm<ChangePasswordDTO>({
    resolver: zodResolver(changePasswordDTO),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  const backAction = useCallback(() => {
    if (isDirty) {
      Alert.alert(LL.UNSAVED_CHANGES(), LL.UNSAVED_CHANGES_PROMPT(), [
        {
          text: LL.CANCEL(),
          onPress: () => null,
          style: "cancel",
        },
        {
          text: LL.DISCARD(),
          onPress: () => {
            reset();
            router.replace("/profile");
          },
        },
      ]);
    } else {
      router.replace("/profile");
    }
    return true;
  }, [isDirty, reset, LL]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );
    return () => backHandler.remove();
  }, [backAction]);

  return (
    <WaveDecoratedView>
      <Tabs.Screen
        options={{
          title: LL.CHANGE_PASSWORD(),
          headerLeft: () => (
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={backAction}
            >
              <Ionicons
                name="arrow-back"
                size={18}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          ),
          href: null,
        }}
      />
      <View
        style={{
          flex: 1,
          gap: 8,
          margin: 8,
          marginTop: 16,
        }}
      >
        <ControlledInput
          control={control}
          id="currentPassword"
          name="currentPassword"
          placeholder={LL.CURRENT_PASSWORD()}
          keyboardType="default"
          secureTextEntry={!showCurrentPassword}
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
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              <Feather
                name={showCurrentPassword ? "eye-off" : "eye"}
                size={20}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </ControlledInput>

        <ControlledInput
          control={control}
          id="password"
          name="password"
          placeholder={LL.NEW_PASSWORD()}
          keyboardType="default"
          secureTextEntry={!showNewPassword}
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
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Feather
                name={showNewPassword ? "eye-off" : "eye"}
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
          secureTextEntry={!showNewPassword}
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
            marginHorizontal: 16,
          }}
          buttonColor={theme.colors.primaryContainer}
          onPress={handleSubmit((data) =>
            updateUserPassword(data).then(() => {
              reset();
              router.replace("/profile");
            }),
          )}
          disabled={!isDirty || isUpdateUserPasswordPending}
          loading={isUpdateUserPasswordPending}
        >
          {LL.SAVE_CHANGES()}
        </Button>
      </View>
    </WaveDecoratedView>
  );
}
