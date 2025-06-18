import { useMutation } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { setPasswordDTO, type SetPasswordDTO } from "@/lib/dtos";
import { TouchableOpacity, BackHandler, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useCallback, useState } from "react";
import { router, Tabs, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import WaveDecoratedView from "@/components/WaveDecoratedView";
import { useCurrentUser } from "@/lib/queries/user";
import ControlledInput from "@/components/ControlledInput";
import { Button, Dialog, Portal, Text, useTheme } from "react-native-paper";
import { useI18nContext } from "@/i18n/i18n-react";
import { toast } from "sonner-native";
import { isXiorError } from "xior";
import Animated, { BounceInUp, BounceOutDown } from "react-native-reanimated";

export default function SetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";
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

  const [isUnsavedChangesDialogVisible, setIsUnsavedChangesDialogVisible] =
    useState(false);

  const backAction = useCallback(() => {
    if (isDirty) {
      setIsUnsavedChangesDialogVisible(true);
    } else {
      router.back();
    }
    return true;
  }, [isDirty]);

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction,
      );

      return () => {
        backHandler.remove();
      };
    }, [backAction]),
  );

  return (
    <WaveDecoratedView>
      <Tabs.Screen
        options={{
          title: LL.SET_PASSWORD(),
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
      <Portal>
        <Dialog visible={isUnsavedChangesDialogVisible}>
          <Dialog.Title style={{ textAlign: forceRTL ? "right" : "left" }}>
            {LL.UNSAVED_CHANGES()}
          </Dialog.Title>
          <Dialog.Content>
            <Text
              style={{ textAlign: forceRTL ? "right" : "left" }}
              variant="bodyMedium"
            >
              {LL.UNSAVED_CHANGES_PROMPT()}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                reset();
                router.back();
                setIsUnsavedChangesDialogVisible(false);
              }}
            >
              {LL.DISCARD()}
            </Button>
            <Button onPress={() => setIsUnsavedChangesDialogVisible(false)}>
              {LL.CANCEL()}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Animated.View
        style={{
          flex: 1,
          gap: 8,
          margin: 40,
        }}
        entering={BounceInUp.delay(200)}
        exiting={BounceOutDown}
      >
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
            marginHorizontal: 16,
          }}
          buttonColor={theme.colors.primaryContainer}
          onPress={handleSubmit((data) =>
            setUserPassword(data).then(() => {
              reset();
              currentUser.refetch();
              router.back();
            }),
          )}
          disabled={!isDirty || isSetPasswordPending}
          loading={isSetPasswordPending}
        >
          {LL.SET_PASSWORD()}
        </Button>
      </Animated.View>
    </WaveDecoratedView>
  );
}
