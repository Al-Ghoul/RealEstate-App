import {
  RefreshControl,
  TouchableOpacity,
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  useCurrentUser,
  useCurrentUserProfile,
  useUploadUserProfileImage,
} from "@/lib/queries/user";
import { ProfileSkeleton } from "@/components/profile/Skeleton";
import WaveDecoratedView from "@/components/WaveDecoratedView";
import ProfileImage from "@/components/profile/Image";
import { Banner, Button, Divider, useTheme } from "react-native-paper";
import { useI18nContext } from "@/i18n/i18n-react";
import { PropertyCardSkeleton } from "@/components/property/Skeleton";
import PropertyCard from "@/components/property/PropertyCard";
import { useInfiniteQuery } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import { useIsFocused } from "@react-navigation/native";

export default function ProfileScreen() {
  const theme = useTheme();
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";
  const isFocused = useIsFocused();
  const currentUser = useCurrentUser();
  const currentUserProfile = useCurrentUserProfile();
  const {
    mutateAsync: updateUserProfileImage,
    isPending: isUpdateUserProfileImagePending,
    cancel: cancelUpdateUserProfileImage,
  } = useUploadUserProfileImage();
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

  return (
    <WaveDecoratedView>
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
              currentUserProfile.isFetching
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
            marginBottom: 8,
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
        {currentUser.isLoading ? (
          <View style={{ alignItems: "center" }}>
            <ProfileSkeleton />
          </View>
        ) : (
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 24,
            }}
          >
            <View
              style={{
                gap: 8,
              }}
            >
              {image ? (
                <TouchableOpacity
                  onPress={() => {
                    cancelUpdateUserProfileImage();
                    setImage(null);
                  }}
                  style={{
                    width: 96,
                    height: 96,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    borderRadius: 50,
                    position: "absolute",
                    zIndex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="x" size={24} color="white" />
                </TouchableOpacity>
              ) : null}

              <View style={{ width: 96, height: 96, borderRadius: 50 }}>
                {image ? (
                  <Image
                    source={{ uri: image.uri }}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 50,
                    }}
                    transition={500}
                  />
                ) : (
                  <ProfileImage
                    source={currentUserProfile.data?.image!}
                    blurHash={currentUserProfile?.data?.imageBlurHash!}
                  />
                )}
                {!image ? (
                  <View
                    style={{
                      position: "absolute",
                      width: 32,
                      height: 32,
                      bottom: 0,
                      right: 0,
                      backgroundColor: theme.colors.onPrimary,
                      borderRadius: 50,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TouchableOpacity onPress={pickImage}>
                      <MaterialCommunityIcons
                        name="camera-plus"
                        size={18}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </View>

            <View
              style={{
                marginTop: 4,
              }}
            >
              <Text
                style={{
                  color: theme.colors.onBackground,
                  fontWeight: "bold",
                }}
              >
                {currentUserProfile.data?.firstName}{" "}
                {currentUserProfile.data?.lastName}
              </Text>
              <Text
                style={{
                  color: theme.colors.onBackground,
                  width: 300,
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
              disabled={!image || isUpdateUserProfileImagePending}
              onPress={() => {
                updateUserProfileImage(image).then(async () => {
                  await currentUserProfile.refetch();
                  setImage(null);
                });
              }}
              loading={isUpdateUserProfileImagePending}
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
        <View style={{ flex: 1, marginHorizontal: 16 }}>
          <View style={{ flex: 1 }}>
            <PropertyCardSkeleton />
          </View>
          <View style={{ flex: 1 }}>
            <PropertyCardSkeleton />
          </View>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          contentContainerStyle={{
            gap: 8,
          }}
          data={data?.pages.flatMap((page) => page.data)}
          onRefresh={refetch}
          refreshing={isFetching || isFetchingNextPage}
          keyExtractor={(item) => item.id}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          renderItem={({ item }) => <PropertyCard property={item} withLink />}
        />
      )}
    </WaveDecoratedView>
  );
}
