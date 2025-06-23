import {
  RefreshControl,
  TouchableOpacity,
  View,
  FlatList,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { useCurrentUser, useCurrentUserProfile } from "@/lib/queries/user";
import WaveDecoratedView from "@/components/WaveDecoratedView";
import ProfileImage from "@/components/profile/Image";
import { Banner, Button, Divider, Text, useTheme } from "react-native-paper";
import { useI18nContext } from "@/i18n/i18n-react";
import { PropertyCardSkeleton } from "@/components/property/Skeleton";
import PropertyCard from "@/components/property/PropertyCard";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import { useIsFocused } from "@react-navigation/native";
import { useAuthStore } from "@/lib/stores/authStore";
import { toast } from "sonner-native";
import { DrawerLayout } from "react-native-gesture-handler";
import { router } from "expo-router";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { LoginManager } from "react-native-fbsdk-next";
import * as FileSystem from "expo-file-system";
import { ProfileSkeleton } from "@/components/profile/Skeleton";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Image } from "expo-image";

export default function ProfileScreen() {
  const theme = useTheme();
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";
  const isFocused = useIsFocused();
  const currentUser = useCurrentUser();
  const currentUserProfile = useCurrentUserProfile();
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const onRefresh = () => {
    currentUser.refetch();
    currentUserProfile.refetch();
    refetch();
  };

  const [order, setOrder] = useState<string | undefined>();

  const {
    data,
    isError,
    fetchNextPage,
    refetch,
    hasNextPage,
    isFetching,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "properties",
      {
        order,
        userId: currentUser.data?.id,
      },
    ],

    queryFn: async (input) => {
      let params: {
        limit: number;
        order?: string;
        cursor?: number;
        userId?: string;
      } = {
        limit: 10,
        cursor: input.pageParam.cursor,
      };

      if (order) params.order = order;
      if (currentUser.data?.id) params.userId = currentUser.data.id;

      const res = await xiorInstance.get("/properties", {
        params,
      });

      return res.data;
    },
    initialPageParam: {
      cursor: 0,
      cursorCreatedAt: undefined,
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta.has_next_page) return undefined;

      return {
        cursor: lastPage.meta.next_cursor,
        cursorCreatedAt: lastPage.meta.cursor_created_at,
      };
    },
    subscribed: isFocused,
  });

  const [isUploading, setIsUploading] = useState(false);
  const session = useAuthStore((state) => state.session);

  const fillHeight = useSharedValue(0);
  const animatedFillStyle = useAnimatedStyle(() => {
    return {
      height: `${fillHeight.value}%`,
    };
  });
  const uploadImageTaskRef = useRef<FileSystem.UploadTask | null>(null);
  const uploadUserProfileImage = useCallback(
    async (image: ImagePicker.ImagePickerAsset) => {
      setIsUploading(true);
      fillHeight.value = 0;
      let uploadCompleted = false;

      try {
        const uploadTask = FileSystem.createUploadTask(
          `${process.env.EXPO_PUBLIC_API_URL}/users/me/profile/image`,
          image.uri,
          {
            httpMethod: "PUT",
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            fieldName: "image",
            mimeType: image.mimeType,
            headers: {
              Authorization: `Bearer ${session?.tokens?.accessToken}`,
              "Accept-Language": locale,
            },
          },
          (progress) => {
            if (uploadCompleted) return;

            const calculatedProgress = Math.min(
              100,
              (progress.totalBytesSent / progress.totalBytesExpectedToSend) *
                100,
            );

            if (calculatedProgress > 5 || calculatedProgress === 100) {
              fillHeight.value = withTiming(calculatedProgress, {
                duration: 100,
                easing: Easing.linear,
              });
            }
          },
        );

        uploadImageTaskRef.current = uploadTask;
        const res = await uploadTask.uploadAsync();

        uploadCompleted = true;
        fillHeight.value = withTiming(100, { duration: 200 });

        if (res?.status === 401) refetch();
        else if (res?.status !== 200)
          throw JSON.parse(res?.body!) as ErrorResponse;

        return JSON.parse(res.body) as SuccessResponse<null>;
      } catch (error) {
        fillHeight.value = withTiming(0, { duration: 200 });
        return Promise.reject(error);
      } finally {
        setTimeout(() => {
          setIsUploading(false);
          fillHeight.value = 0;
        }, 500);
      }
    },
    [session?.tokens?.accessToken, refetch, locale, fillHeight],
  );

  const {
    mutateAsync: uploadUserProfileImageAsync,
    isPending: isUploadingImage,
  } = useMutation({
    mutationFn: uploadUserProfileImage,
    onSuccess: (res) => toast.success(res?.message!),
    onError: (error) => {
      if (typeof error === "object" && "requestId" in error) {
        toast.error(error.message, {
          description: LL.REQUEST_ID({ requestId: error.requestId }),
        });
      }
    },
  });

  return (
    <WaveDecoratedView>
      <SettingsDrawer>
        <ScrollView
          style={{
            marginTop: 40,
            flexGrow: 0,
          }}
          refreshControl={
            <RefreshControl
              refreshing={
                currentUser.isLoading ||
                currentUserProfile.isLoading ||
                currentUser.isFetching ||
                currentUserProfile.isFetching ||
                isFetching ||
                isFetchingNextPage
              }
              onRefresh={onRefresh}
            />
          }
        >
          <Banner
            visible={
              (currentUser.isError || currentUserProfile.isError) &&
              (!currentUser.isFetching || !currentUserProfile.isFetching)
            }
            style={{
              backgroundColor: theme.colors.errorContainer,
            }}
            theme={{
              colors: {
                primary: theme.colors.onErrorContainer,
              },
            }}
            actions={[
              {
                label: LL.RETRY(),
                onPress: onRefresh,
              },
            ]}
          >
            <Text
              style={{
                color: theme.colors.onErrorContainer,
                textAlign: forceRTL ? "right" : "left",
              }}
            >
              {currentUser.isError
                ? LL.ERROR_FETCHING_USER_DATA()
                : currentUserProfile.isError
                ? LL.ERROR_FETCHING_USER_PROFILE_DATA()
                : null}
            </Text>
          </Banner>

          {currentUserProfile.isLoading ? (
            <ProfileSkeleton isLoading />
          ) : (
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                gap: 8,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View style={{ position: "relative", width: 64, height: 64 }}>
                {image && (
                  <TouchableOpacity
                    onPress={() => {
                      uploadImageTaskRef.current?.cancelAsync();
                      setImage(null);
                    }}
                    style={{
                      width: 64,
                      height: 64,
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      borderRadius: 50,
                      position: "absolute",
                      zIndex: 2,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="x" size={24} color="white" />
                  </TouchableOpacity>
                )}

                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 50,
                    overflow: "hidden",
                  }}
                >
                  <ProfileImage
                    source={currentUserProfile.data?.image!}
                    blurHash={currentUserProfile?.data?.imageBlurHash!}
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "absolute",
                    }}
                  />

                  {image && (
                    <Animated.View
                      style={[
                        {
                          width: "100%",
                          position: "absolute",
                          bottom: 0,
                          overflow: "hidden",
                        },
                        animatedFillStyle,
                      ]}
                    >
                      <Image
                        source={{ uri: image.uri }}
                        style={{
                          width: "100%",
                          height: "100%",
                          position: "absolute",
                          bottom: 0,
                        }}
                        contentFit="cover"
                      />
                    </Animated.View>
                  )}
                </View>

                {!image && (
                  <View
                    style={{
                      position: "absolute",
                      width: 24,
                      height: 24,
                      bottom: 0,
                      right: 0,
                      backgroundColor: theme.colors.onPrimary,
                      borderRadius: 50,
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 1,
                    }}
                  >
                    <TouchableOpacity onPress={pickImage}>
                      <MaterialCommunityIcons
                        name="camera-plus"
                        size={16}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View>
                <Text
                  style={{
                    color: theme.colors.onBackground,
                  }}
                  variant="titleMedium"
                >
                  {currentUserProfile.data?.firstName}{" "}
                  {currentUserProfile.data?.lastName}
                </Text>
                <Text
                  style={{
                    color: theme.colors.onBackground,
                    maxWidth: 300,
                  }}
                >
                  {currentUserProfile.data?.bio?.replace(/\\n/g, "\n")}
                </Text>
              </View>
            </View>
          )}

          <Divider
            style={{
              flex: 1,
              marginTop: 8,
            }}
          />

          {image ? (
            <View
              style={{
                flex: 1,
                gap: 8,
                marginTop: 40,
              }}
            >
              <Button
                style={{
                  marginHorizontal: "auto",
                  width: 150,
                  borderRadius: 8,
                }}
                buttonColor={theme.colors.primary}
                textColor={theme.colors.onPrimary}
                disabled={!image}
                onPress={() => {
                  uploadUserProfileImageAsync(image).then(async () => {
                    await currentUserProfile.refetch();
                    setImage(null);
                  });
                }}
                loading={isUploading || isUploadingImage}
              >
                {LL.SAVE_IMAGE()}
              </Button>
            </View>
          ) : null}
        </ScrollView>

        <Pressable
          style={{ alignSelf: "flex-end", marginHorizontal: 16, marginTop: 16 }}
          onPress={() => {
            if (order === "asc") {
              setOrder("desc");
            } else {
              setOrder("asc");
            }
          }}
        >
          {order === "asc" ? (
            <MaterialCommunityIcons
              name="sort-descending"
              size={24}
              color={theme.colors.primary}
            />
          ) : (
            <MaterialCommunityIcons
              name="sort-ascending"
              size={24}
              color={theme.colors.primary}
            />
          )}
        </Pressable>

        <Banner
          visible={isError && !isFetching}
          style={{
            backgroundColor: theme.colors.errorContainer,
          }}
          theme={{
            colors: {
              primary: theme.colors.onErrorContainer,
            },
          }}
          actions={[
            {
              label: LL.RETRY(),
              onPress: () => refetch(),
            },
          ]}
        >
          <Text
            style={{
              color: theme.colors.onErrorContainer,
              textAlign: forceRTL ? "right" : "left",
            }}
          >
            {LL.ERROR_FETCHING_PROPERTIES_DATA()}
          </Text>
        </Banner>

        {isLoading ? (
          <View style={{ flex: 1, gap: 8 }}>
            {Array(5)
              .fill(null)
              .map((_, index) => (
                <PropertyCardSkeleton key={index} isLoading={true} />
              ))}
          </View>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            contentContainerStyle={{
              gap: 8,
            }}
            data={data?.pages.flatMap((page) => page.data)}
            keyExtractor={(item) => item.id}
            onEndReached={() => {
              if (hasNextPage) fetchNextPage();
            }}
            renderItem={({ item }) => <PropertyCard property={item} withLink />}
          />
        )}
      </SettingsDrawer>
    </WaveDecoratedView>
  );
}

function SettingsDrawer({ children }: { children: ReactNode }) {
  const windowWidth = Dimensions.get("window").width;
  const theme = useTheme();
  const { LL } = useI18nContext();
  const logout = useAuthStore((state) => state.logout);
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();

  const { mutateAsync: logoutMutation, isPending: isLoggingOut } = useMutation({
    mutationFn: () =>
      xiorInstance.post("/auth/me/logout").then((res) => res.data),
    onSuccess: (res) => toast.success(res.message),
  });

  return (
    <DrawerLayout
      drawerWidth={windowWidth / 2.3}
      drawerPosition={"right"}
      drawerType="slide"
      renderNavigationView={() => (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View
            style={{
              flex: 1,
              gap: 8,
              marginTop: 40,
              margin: 8,
            }}
          >
            <Button
              style={{
                alignSelf: "center",
                width: "100%",
                borderRadius: 8,
              }}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              compact
              mode="outlined"
              onPress={() => {
                router.push("/edit-profile");
              }}
            >
              {LL.EDIT_PROFILE()}
            </Button>

            <Button
              style={{
                alignSelf: "center",
                width: "100%",
                borderRadius: 8,
              }}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              onPress={() => {
                if (currentUser.data?.hasPassword)
                  router.push("/change-password");
                else router.push("/set-password");
              }}
            >
              {currentUser.data?.hasPassword
                ? LL.CHANGE_PASSWORD()
                : LL.SET_PASSWORD()}
            </Button>
          </View>

          <View
            style={{
              margin: 16,
            }}
          >
            <Button
              style={{
                width: "100%",
                borderRadius: 8,
                alignSelf: "center",
              }}
              mode="outlined"
              compact
              disabled={isLoggingOut}
              onPress={() => {
                logoutMutation().finally(() => {
                  logout();
                  queryClient.clear();
                  GoogleSignin.signOut();
                  LoginManager.logOut();
                  router.replace("/");
                });
              }}
            >
              {LL.LOGOUT()}
            </Button>
          </View>
        </View>
      )}
    >
      {children}
    </DrawerLayout>
  );
}
