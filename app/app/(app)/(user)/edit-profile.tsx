import {
  useCurrentUser,
  useCurrentUserProfile,
  useUserAccounts,
} from "@/lib/queries/user";
import {
  TouchableOpacity,
  BackHandler,
  ScrollView,
  RefreshControl,
  View,
} from "react-native";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { router, Tabs, useFocusEffect, usePathname } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ProfileSkeleton } from "@/components/profile/Skeleton";
import WaveDecoratedView from "@/components/WaveDecoratedView";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import LinkAccounts from "@/components/profile/LinkAccounts";
import EmailVerification from "@/components/profile/EmailVerification";
import ChangeEmail from "@/components/profile/ChangeEmail";
import UpdateUserProfile from "@/components/profile/UpdateUserProfile";
import { useForm } from "react-hook-form";
import {
  updateEmailDTO,
  updateProfileDTO,
  type UpdateProfileDTO,
  type UpdateEmailDTO,
} from "@/lib/dtos";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Banner,
  Button,
  Dialog,
  Divider,
  Portal,
  Text,
  useTheme,
} from "react-native-paper";
import { useI18nContext } from "@/i18n/i18n-react";

export default function EditProfile() {
  const theme = useTheme();
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";
  const currentPath = usePathname();
  const currentUser = useCurrentUser();
  const currentUserProfile = useCurrentUserProfile();
  const accounts = useUserAccounts();
  const sheet = useRef<TrueSheet>(null);
  const {
    control: updateEmailControl,
    handleSubmit: updateEmailHandleSubmit,
    formState: { isDirty: updateEmailIsDirty },
    reset: updateEmailReset,
  } = useForm<UpdateEmailDTO>({
    values: {
      email: currentUser.data?.email ?? "",
    },
    resolver: zodResolver(updateEmailDTO),
  });

  const {
    control: profileControl,
    handleSubmit: profileHandleSubmit,
    formState: { isDirty: profileIsDirty },
    reset: profileReset,
  } = useForm<UpdateProfileDTO>({
    values: {
      firstName: currentUserProfile.data?.firstName ?? "",
      lastName: currentUserProfile.data?.lastName ?? "",
      bio: currentUserProfile.data?.bio ?? "",
    },
    resolver: zodResolver(updateProfileDTO),
  });

  const [isUnsavedChangesDialogVisible, setIsUnsavedChangesDialogVisible] =
    useState(false);

  const backAction = useCallback(() => {
    if (updateEmailIsDirty || profileIsDirty) {
      setIsUnsavedChangesDialogVisible(true);
    } else {
      router.replace("/profile");
    }
    return true;
  }, [updateEmailIsDirty, profileIsDirty]);

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

  useEffect(() => {
    if (!currentUser.data?.emailVerified && currentPath === "/edit-profile") {
      sheet.current?.present();
    }
  }, [currentUser.data?.emailVerified, currentPath]);

  const onRefresh = () => {
    accounts.refetch();
    currentUser.refetch();
    currentUserProfile.refetch();
  };

  return (
    <WaveDecoratedView>
      <Tabs.Screen
        options={{
          title: LL.EDIT_PROFILE(),
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
                updateEmailReset();
                profileReset();
                router.replace("/profile");
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
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={
              currentUser.isLoading ||
              currentUser.isFetching ||
              accounts.isLoading ||
              accounts.isFetching ||
              currentUserProfile.isLoading ||
              currentUserProfile.isFetching
            }
            onRefresh={onRefresh}
          />
        }
      >
        <Banner
          visible={
            (currentUser.isError ||
              currentUserProfile.isError ||
              accounts.isError) &&
            (!currentUser.isFetching ||
              !currentUserProfile.isFetching ||
              !accounts.isFetching)
          }
          style={{
            backgroundColor: theme.colors.error,
            marginBottom: 8,
          }}
          theme={{
            colors: {
              primary: theme.colors.onError,
            },
          }}
          actions={[
            {
              label: "Retry",
              onPress: onRefresh,
            },
          ]}
        >
          <Text style={{ color: theme.colors.onError }}>
            {currentUser.isError
              ? "An error occurred while fetching user data"
              : currentUserProfile.isError
                ? "An error occurred while fetching user profile data"
                : accounts.isError
                  ? "An error occurred while fetching user accounts data"
                  : null}
          </Text>
        </Banner>

        <View
          style={{
            gap: 24,
            marginHorizontal: 8,
          }}
        >
          {currentUser.isLoading ? (
            <View style={{ alignItems: "center" }}>
              <ProfileSkeleton />
            </View>
          ) : (
            <View
              style={{
                marginHorizontal: 8,
              }}
            >
              <Image
                source={currentUserProfile.data?.image}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 100,
                  marginHorizontal: "auto",
                }}
                transition={500}
              />
            </View>
          )}

          <ChangeEmail
            sheet={sheet}
            control={updateEmailControl}
            handleSubmit={updateEmailHandleSubmit}
            isDirty={updateEmailIsDirty}
          />

          <Divider style={{ flex: 1, marginHorizontal: 16 }} />

          <UpdateUserProfile
            control={profileControl}
            handleSubmit={profileHandleSubmit}
            isDirty={profileIsDirty}
          />

          <LinkAccounts />
        </View>
      </ScrollView>

      <TrueSheet
        ref={sheet}
        sizes={["small"]}
        cornerRadius={20}
        backgroundColor={theme.colors.background}
        contentContainerStyle={{
          padding: 16,
        }}
      >
        <EmailVerification sheet={sheet} />
      </TrueSheet>
    </WaveDecoratedView>
  );
}
