import { useMutation } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { setPasswordDTO, type SetPasswordDTO } from "@/lib/dtos";
import { TouchableOpacity, Alert, BackHandler, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useCallback, useEffect, useState } from "react";
import { router, Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import WaveDecoratedView from "@/components/WaveDecoratedView";
import { useCurrentUser } from "@/lib/queries/user";
import ControlledInput from "@/components/ControlledInput";
import { Button, useTheme } from "react-native-paper";
import { useI18nContext } from "@/i18n/i18n-react";

export default function SetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const { LL } = useI18nContext();
  const currentUser = useCurrentUser();
  const theme = useTheme();
  const {
    control,
    handleSubmit,
    formState: { isDirty },
    reset,
  } = useForm<SetPasswordDTO>({
    resolver: zodResolver(setPasswordDTO),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const { mutateAsync: setUserPassword, isPending: isSetPasswordPending } =
    useMutation({
      mutationKey: ["setPassword"],
      mutationFn: (data: SetPasswordDTO) =>
        xiorInstance
          .post("/auth/me/set-password", data)
          .then((res) => res.data),
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
  }, [isDirty, , reset, LL]);

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
          title: "Set Password",
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
          margin: 40,
        }}
      >
        <ControlledInput
          control={control}
          id="password"
          name="password"
          placeholder="Password"
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
              right: 20,
            }}
          >
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? "eye" : "eye-off"}
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
          placeholder="Confirm Password"
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
            marginHorizontal: 16,
          }}
          buttonColor={theme.colors.primaryContainer}
          onPress={handleSubmit((data) =>
            setUserPassword(data).then(() => {
              reset();
              currentUser.refetch();
              router.replace("/profile");
            }),
          )}
          disabled={!isDirty || isSetPasswordPending}
          loading={isSetPasswordPending}
        >
          Set Password
        </Button>
      </View>
    </WaveDecoratedView>
  );
}
