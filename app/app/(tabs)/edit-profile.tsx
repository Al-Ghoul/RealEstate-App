import { useCurrentUser } from "@/lib/queries/useCurrentUser";
import { useMutation } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateProfileInputDTO,
  verifyInputDTO,
  type VerifyInputDTO,
  type UpdateProfileInputDTO,
} from "@/lib/dtos";
import {
  TextInput,
  Text,
  View,
  TouchableOpacity,
  Alert,
  BackHandler,
  ScrollView,
  RefreshControl,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Image } from "expo-image";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useRef } from "react";
import { router, Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { showMessage } from "react-native-flash-message";
import { XiorError } from "xior";
import { ProfileSkeleton } from "@/components/ui/profile/Skeleton";
import GenericView from "@/components/ui/GenericView";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import VerificationViews from "@/components/VerificationViews";
import Octicons from "@expo/vector-icons/Octicons";

export default function EditProfile() {
  const currentUser = useCurrentUser();
  const sheet = useRef<TrueSheet>(null);
  const { colorScheme } = useColorScheme();
  const updateUserProfile = useMutation({
    mutationKey: ["profileImage"],
    mutationFn: async (data: UpdateProfileInputDTO) =>
      await xiorInstance.patch("/users/me", data),
    onSuccess: () => {
      showMessage({
        message: "Updated successfully",
        type: "success",
      });
      router.replace("/profile");
    },
    onError: (error) => {
      if (error instanceof XiorError) {
        if (
          typeof error.response?.data === "object" &&
          "errors" in error.response?.data
        ) {
          error.response?.data.errors.map((error: { message: string }) =>
            setError("root", { message: error.message }),
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
  const requestEmailVerificationCode = useMutation({
    mutationKey: ["requestEmailVerificationCode"],
    mutationFn: async () =>
      await xiorInstance.post("/auth/request-email-verification-code"),
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
    formState: { errors: emailVerificationErrors },
    setError: setEmailVerificationError,
  } = useForm<VerifyInputDTO>({
    resolver: zodResolver(verifyInputDTO),
  });
  const verifyEmail = useMutation({
    mutationKey: ["verifyEmail"],
    mutationFn: async (data: VerifyInputDTO) =>
      await xiorInstance.post("/auth/verify", data),
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
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    setError,
    reset,
  } = useForm<UpdateProfileInputDTO>({
    values: {
      email: currentUser.data?.email ?? "",
      firstName: currentUser.data?.firstName ?? "",
      lastName: currentUser.data?.lastName ?? "",
    },
    resolver: zodResolver(updateProfileInputDTO),
  });
  const backAction = useCallback(() => {
    if (isDirty) {
      Alert.alert(
        "Unsaved changes",
        "Are you sure you want to discard these changes?",
        [
          {
            text: "Cancel",
            onPress: () => null,
            style: "cancel",
          },
          {
            text: "Discard",
            onPress: () => {
              reset();
              router.replace("/profile");
            },
          },
        ],
      );
    } else {
      router.replace("/profile");
    }
    return true;
  }, [isDirty, reset]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );
    return () => backHandler.remove();
  }, [backAction]);

  useEffect(() => {
    if (!currentUser.data?.emailVerified) sheet.current?.present();
  }, [currentUser.data, currentUser.data?.emailVerified]);

  return (
    <GenericView>
      <Tabs.Screen
        options={{
          title: "Edit Profile",
          headerLeft: () => (
            <TouchableOpacity
              className="items-center justify-center w-10 h-10 rounded-full"
              onPress={backAction}
            >
              <Ionicons
                name="arrow-back"
                size={18}
                color={colorScheme === "light" ? "#000" : "#fff"}
              />
            </TouchableOpacity>
          ),
          href: null,
        }}
      />
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={currentUser.isLoading}
            onRefresh={currentUser.refetch}
          />
        }
      >
        {currentUser.isLoading ? (
          <View className="h-36 mx-auto">
            <ProfileSkeleton />
          </View>
        ) : (
          <View className="mx-4 gap-8">
            <Image
              source={currentUser.data?.image}
              style={{
                width: 96,
                height: 96,
                borderRadius: 100,
                marginHorizontal: "auto",
              }}
              transition={500}
            />

            <Controller
              control={control}
              rules={{
                required: true,
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="flex-row dark:bg-white bg-black px-4 items-center h-12 rounded-3xl">
                  <TextInput
                    id="email"
                    className="dark:text-black text-white placeholder:text-gray-500 h-full w-full"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    placeholder="Email"
                    keyboardType="email-address"
                  />
                  {!currentUser.data?.emailVerified ? (
                    <TouchableOpacity
                      className="dark:bg-black bg-white disabled:bg-gray-500 w-28 h-8 rounded-lg absolute right-20"
                      onPress={() => sheet.current?.present()}
                      disabled={
                        currentUser.isLoading ||
                        !!currentUser.data?.emailVerified
                      }
                    >
                      <Text className="text-center my-auto dark:text-white text-black">
                        Verify
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  <Feather
                    name="mail"
                    size={24}
                    color={colorScheme === "light" ? "#fff" : "#000"}
                    className="absolute right-2"
                  />
                </View>
              )}
              name="email"
            />
            {errors.email ? (
              <Text className="text-red-500 text-center">
                {errors.email.message}
              </Text>
            ) : null}

            <Controller
              control={control}
              rules={{
                required: true,
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="flex-row dark:bg-white bg-black px-4 items-center h-12 rounded-3xl">
                  <TextInput
                    id="firstName"
                    className="dark:text-black text-white placeholder:text-gray-500 h-full w-full"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    placeholder="First Name"
                  />
                  <Feather
                    name="user"
                    size={24}
                    color={colorScheme === "light" ? "#fff" : "#000"}
                    className="absolute right-2"
                  />
                </View>
              )}
              name="firstName"
            />
            {errors.firstName ? (
              <Text className="text-red-500 text-center">
                {errors.firstName.message}
              </Text>
            ) : null}

            <Controller
              control={control}
              rules={{
                required: true,
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="flex-row dark:bg-white bg-black px-4 items-center h-12 rounded-3xl">
                  <TextInput
                    id="lastName"
                    className="dark:text-black text-white placeholder:text-gray-500 h-full w-full"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    placeholder="Last Name"
                  />
                  <Feather
                    name="user"
                    size={24}
                    color={colorScheme === "light" ? "#fff" : "#000"}
                    className="absolute right-2"
                  />
                </View>
              )}
              name="lastName"
            />
            {errors.lastName ? (
              <Text className="text-red-500 text-center">
                {errors.lastName.message}
              </Text>
            ) : null}

            <TouchableOpacity
              className="self-center dark:bg-white bg-black disabled:bg-gray-500 w-32 h-8 rounded-lg"
              onPress={handleSubmit((data) =>
                updateUserProfile
                  .mutateAsync(data)
                  .then(() => currentUser.refetch()),
              )}
              disabled={!isDirty || updateUserProfile.isPending}
            >
              <Text className="text-center my-auto dark:text-black text-white">
                Save Changes
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <TrueSheet
        ref={sheet}
        sizes={["small"]}
        cornerRadius={20}
        contentContainerStyle={{
          flex: 1,
          borderRadius: 20,
          backgroundColor: colorScheme === "light" ? "#000" : "#fff",
        }}
      >
        <VerificationViews
          view1={({ switchView }) => (
            <View className="flex-row mx-auto my-auto gap-4">
              <TouchableOpacity
                className="dark:bg-black bg-white px-4 py-2 rounded-lg"
                onPress={() => {
                  requestEmailVerificationCode.mutate();
                  switchView("view2");
                }}
              >
                <Text className="dark:text-white text-black">Send Code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="border border-red-800 px-4 py-2 rounded-lg"
                onPress={() => sheet.current?.dismiss()}
              >
                <Text className="dark:text-black text-white text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}
          view2={() => (
            <View className="flex-1 mx-4 my-auto gap-4">
              <Controller
                control={emailVerificationControl}
                rules={{
                  required: true,
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="flex-row px-4 items-center h-12 rounded-3xl mx-8 dark:bg-black bg-white">
                    <TextInput
                      id="code"
                      className="dark:text-white text-black placeholder:text-gray-500 h-full w-full"
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                      placeholder="Verification Code"
                    />
                    <Octicons
                      name="number"
                      size={24}
                      color={colorScheme === "light" ? "#000" : "#fff"}
                      className="absolute right-2"
                    />
                  </View>
                )}
                name="code"
              />
              {emailVerificationErrors.code ? (
                <Text className="text-red-500 text-center">
                  {emailVerificationErrors.code.message}
                </Text>
              ) : null}
              <View className="flex-row mx-auto gap-4">
                <TouchableOpacity
                  className="w-24 dark:bg-black bg-white px-4 py-2 rounded-lg"
                  onPress={handleEmailVerificationSubmit((data) =>
                    verifyEmail
                      .mutateAsync(data)
                      .then(() => sheet.current?.dismiss()),
                  )}
                >
                  <Text className="dark:text-white text-black text-center">
                    Verify
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="border border-red-800 px-4 py-2 rounded-lg"
                  onPress={() => sheet.current?.dismiss()}
                >
                  <Text className="dark:text-black text-white text-center">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </TrueSheet>
    </GenericView>
  );
}
