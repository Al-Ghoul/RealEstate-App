import { router, Tabs, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import {
  Banner,
  Button,
  Divider,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useI18nContext } from "@/i18n/i18n-react";
import { useMutation } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useCurrentUser, useGetUserProfile } from "@/lib/queries/user";
import PagerView from "react-native-pager-view";
import { Image } from "expo-image";
import Feather from "@expo/vector-icons/Feather";
import { toast } from "sonner-native";
import { useProperty, usePropertyMedia } from "@/lib/queries/property";
import { isXiorError } from "xior";
import { queryClient } from "@/lib/client";
import { PropertyCardSkeleton } from "@/components/property/Skeleton";
import ProfileImage from "@/components/profile/Image";
import Ionicons from "@expo/vector-icons/Ionicons";
import { UserProfileSkeleton } from "@/components/profile/Skeleton";
import { VideoPlayer } from "./media/add";

export default function PropertyDetailsScreen() {
  const params = useLocalSearchParams<{
    id: string;
  }>();
  const { id } = params;
  const mapRef = useRef<MapView>(null);
  const theme = useTheme();
  const { data: currentUser } = useCurrentUser();
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [autoSlideActive, setAutoSlideActive] = useState(true);

  const {
    data: propertyData,
    isError: isPropertyError,
    refetch: propertyRefetch,
    isFetching: isFetchingProperty,
    isLoading: isLoadingProperty,
    isPending: isPendingProperty,
  } = useProperty(parseInt(id));

  const { data: propertyMediaData, refetch: propertyMediaRefetch } =
    usePropertyMedia(parseInt(id));

  const { mutateAsync: deleteMedia } = useMutation({
    mutationKey: ["delete-property-media", id],
    mutationFn: (item: PropertyMedia) =>
      xiorInstance
        .delete(`/properties/${id}/media/${item.id}`)
        .then((res) => res.data),
    onSuccess: (res) => {
      toast.success(res.message, {
        position: "bottom-center",
      });
      propertyMediaRefetch().then(() => {
        const newMediaLength = (propertyMediaData?.length ?? 1) - 1;
        if (newMediaLength === 0) {
          setCurrentPage(0);
        } else if (currentPage >= newMediaLength) {
          const newPage = Math.max(0, newMediaLength - 1);
          setCurrentPage(newPage);
          setTimeout(() => {
            if (pagerRef.current) {
              pagerRef.current.setPage(newPage);
            }
          }, 100);
        }
      });
      propertyRefetch();
    },
  });

  const { mutateAsync: deleteProperty } = useMutation({
    mutationKey: ["delete-property", id],
    mutationFn: () =>
      xiorInstance.delete(`/properties/${id}`).then((res) => res.data),
    onSuccess: (res) => {
      toast.success(res.message, {
        position: "bottom-center",
      });
      router.push("/");
    },
    onError: (error) => {
      if (isXiorError(error)) {
        toast.error(error.response?.data.message, {
          description: LL.REQUEST_ID({
            requestId: error.response?.data.requestId,
          }),
        });
      } else {
        toast.error(error.message);
      }
    },
  });

  const { data: userProfileData, isLoading: isLoadingUserProfile } =
    useGetUserProfile(propertyData?.userId ?? "");

  const totalPages = propertyMediaData?.length ?? 0;

  useEffect(() => {
    if (!autoSlideActive || !propertyMediaData?.length || totalPages <= 1)
      return;

    const interval = setInterval(() => {
      setCurrentPage((prevPage) => {
        const nextPage = (prevPage + 1) % totalPages;
        if (pagerRef.current) {
          pagerRef.current.setPage(nextPage);
        }
        return nextPage;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [autoSlideActive, totalPages, propertyMediaData]);

  useEffect(() => {
    if (
      propertyMediaData &&
      currentPage >= propertyMediaData.length &&
      propertyMediaData.length > 0
    ) {
      const newPage = Math.max(0, propertyMediaData.length - 1);
      setCurrentPage(newPage);
      if (pagerRef.current) {
        pagerRef.current.setPage(newPage);
      }
    }
  }, [propertyMediaData, currentPage]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (mapRef.current && propertyData) {
        mapRef.current.animateToRegion(
          {
            latitude: propertyData?.location.y,
            longitude: propertyData?.location.x,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          1000,
        );
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [propertyData]);

  if (isLoadingProperty || isPendingProperty) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <PropertyCardSkeleton isLoading={true} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Tabs.Screen
        options={{
          title: propertyData?.title,
          headerLeft: () => (
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => router.back()}
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

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isFetchingProperty}
            onRefresh={() => {
              propertyRefetch();
              propertyMediaRefetch();
            }}
          />
        }
      >
        <Banner
          visible={isPropertyError && !isFetchingProperty}
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
              onPress: () => propertyRefetch(),
            },
          ]}
        >
          <Text
            style={{
              color: theme.colors.onErrorContainer,
              textAlign: forceRTL ? "right" : "left",
            }}
          >
            {isPropertyError ? LL.ERROR_FETCHING_PROPERTY_DATA() : null}
          </Text>
        </Banner>

        {propertyData && (
          <>
            <View>
              <Image
                style={{ height: 250, width: "100%" }}
                source={{ uri: propertyData.thumbnailURL }}
                contentFit="cover"
                transition={1000}
              />
              {propertyData.userId === currentUser?.id && (
                <View
                  style={{
                    flexDirection: "row",
                    position: "absolute",
                    right: 16,
                    top: 16,
                    gap: 4,
                  }}
                >
                  <TouchableRipple
                    onPress={() => router.push(`/property/${id}/media/add`)}
                    style={{
                      backgroundColor: "rgba(0,0,0,0.5)",
                      padding: 8,
                      borderRadius: 50,
                    }}
                    borderless
                  >
                    <MaterialCommunityIcons
                      name="image-plus"
                      size={20}
                      color={theme.colors.primary}
                    />
                  </TouchableRipple>
                  <TouchableRipple
                    onPress={() => router.push(`/property/${id}/edit/`)}
                    style={{
                      backgroundColor: "rgba(0,0,0,0.5)",
                      padding: 8,
                      borderRadius: 50,
                    }}
                    borderless
                  >
                    <Feather
                      name="edit-2"
                      size={20}
                      color={theme.colors.primary}
                    />
                  </TouchableRipple>
                  <TouchableRipple
                    onPress={() =>
                      deleteProperty().then(() =>
                        queryClient.invalidateQueries({
                          queryKey: ["properties"],
                        }),
                      )
                    }
                    style={{
                      backgroundColor: "rgba(0,0,0,0.5)",
                      padding: 8,
                      borderRadius: 50,
                    }}
                    borderless
                  >
                    <Feather
                      name="trash-2"
                      size={20}
                      color={theme.colors.error}
                    />
                  </TouchableRipple>
                </View>
              )}
            </View>

            <View
              style={{
                marginHorizontal: 8,
                alignItems: forceRTL ? "flex-end" : "flex-start",
              }}
            >
              <Text variant="headlineLarge">{propertyData.title}</Text>
              <Text variant="bodyMedium">{propertyData.description}</Text>
            </View>

            <Divider style={{ marginVertical: 8, marginHorizontal: 8 }} />

            <View style={{ flex: 1, margin: 8 }}>
              {isLoadingUserProfile ? (
                <UserProfileSkeleton isLoading={isLoadingUserProfile} />
              ) : (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Pressable
                    onPress={() => {
                      if (currentUser?.id !== propertyData.userId) {
                        router.push(
                          `/(app)/(user)/user/${propertyData.userId}/profile`,
                        );
                      }
                    }}
                    style={{ width: 48, height: 48, borderRadius: 50 }}
                  >
                    <ProfileImage
                      source={userProfileData?.image!}
                      blurHash={userProfileData?.imageBlurHash!}
                    />
                  </Pressable>
                  <View>
                    <Pressable
                      onPress={() => {
                        if (currentUser?.id !== propertyData.userId) {
                          router.push(
                            `/(app)/(user)/user/${propertyData.userId}/profile`,
                          );
                        }
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors.onBackground,
                        }}
                        variant="bodyMedium"
                      >
                        {userProfileData?.firstName} {userProfileData?.lastName}
                      </Text>
                    </Pressable>
                    <Divider style={{ marginVertical: 4 }} />
                    {currentUser?.id !== propertyData.userId ? (
                      <Button
                        icon="email"
                        mode="text"
                        compact
                        onPress={() => {
                          const ids = [
                            currentUser?.id,
                            propertyData.userId,
                          ].sort();

                          router.push(`/(chat)/${ids[0]}_${ids[1]}/chat`);
                        }}
                      >
                        {LL.CONTACT()}
                      </Button>
                    ) : null}
                  </View>
                </View>
              )}
              <View
                style={{
                  flexDirection: forceRTL ? "row-reverse" : "row",
                  justifyContent: "space-between",
                }}
              >
                <Text>{LL.PRICE()}</Text>
                <Text>{propertyData.price}</Text>
              </View>
              <View
                style={{
                  flexDirection: forceRTL ? "row-reverse" : "row",
                  justifyContent: "space-between",
                }}
              >
                <Text>{LL.PROPERTY_TYPE()}</Text>

                <Text>
                  {
                    // @ts-ignore
                    LL[propertyData.type.toUpperCase()]()
                  }
                </Text>
              </View>
              <View
                style={{
                  flexDirection: forceRTL ? "row-reverse" : "row",
                  justifyContent: "space-between",
                }}
              >
                <Text>{LL.PROPERTY_STATUS()}</Text>
                <Text>
                  {
                    // @ts-ignore
                    LL[propertyData.status.toUpperCase()]()
                  }
                </Text>
              </View>
              <View
                style={{
                  flexDirection: forceRTL ? "row-reverse" : "row",
                  justifyContent: "space-between",
                }}
              >
                <Text>{LL.AREA()}</Text>
                <Text>{propertyData.area} m²</Text>
              </View>
              <View
                style={{
                  flexDirection: forceRTL ? "row-reverse" : "row",
                  justifyContent: "space-between",
                }}
              >
                <Text>{LL.ROOMS_COUNT()}</Text>
                <Text>{propertyData.rooms}</Text>
              </View>
            </View>

            <MapView
              ref={mapRef}
              scrollEnabled={false}
              style={{ width: "100%", height: 250 }}
              initialRegion={{
                latitude: 31.1249,
                longitude: 33.798,
                latitudeDelta: 0.002,
                longitudeDelta: 0.002,
              }}
            >
              <Marker
                coordinate={{
                  latitude: propertyData.location.y,
                  longitude: propertyData.location.x,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      color: "green",
                      fontWeight: "bold",
                    }}
                  >
                    {LL.PRICE_LABEL({ price: propertyData.price })}
                  </Text>
                  {(() => {
                    switch (propertyData.type) {
                      case "APARTMENT":
                        return (
                          <MaterialIcons
                            name="apartment"
                            size={24}
                            color="green"
                          />
                        );
                      case "HOUSE":
                        return (
                          <FontAwesome6
                            name="house-chimney"
                            size={16}
                            color="green"
                          />
                        );
                      case "LAND":
                        return (
                          <MaterialIcons
                            name="terrain"
                            size={24}
                            color="green"
                          />
                        );
                      case "COASTAL":
                        return (
                          <MaterialCommunityIcons
                            name="island"
                            size={24}
                            color="green"
                          />
                        );
                      case "COMMERCIAL":
                        return (
                          <FontAwesome6
                            name="warehouse"
                            size={24}
                            color="green"
                          />
                        );
                    }
                  })()}
                </View>
              </Marker>
            </MapView>

            {propertyMediaData && propertyMediaData.length > 0 && (
              <PagerView
                key={`pager-${propertyMediaData.length}-${propertyMediaData
                  .map((m) => m.id)
                  .join("-")}`}
                ref={pagerRef}
                style={{ height: 250 }}
                scrollEnabled={!!propertyMediaData.length}
                initialPage={Math.min(
                  currentPage,
                  propertyMediaData.length - 1,
                )}
                onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
                onTouchStart={() => {
                  setAutoSlideActive(false);
                }}
                onTouchEnd={() => {
                  setTimeout(() => setAutoSlideActive(true), 2000);
                }}
              >
                {propertyMediaData.map((item, index) => (
                  <View key={`media-${item.id}`} style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        position: "absolute",
                        width: "100%",
                        justifyContent: "space-between",
                        padding: 16,
                        zIndex: 1,
                      }}
                    >
                      <Text
                        style={{
                          backgroundColor: "rgba(0,0,0,0.5)",
                          color: "white",
                          textAlign: "center",
                          textAlignVertical: "center",
                          fontWeight: "bold",
                          padding: 8,
                          borderRadius: 50,
                        }}
                      >
                        {index + 1} / {propertyMediaData.length}
                      </Text>
                      {propertyData.userId === currentUser?.id && (
                        <TouchableRipple
                          onPress={() => deleteMedia(item)}
                          style={{
                            backgroundColor: "rgba(0,0,0,0.5)",
                            padding: 8,
                            borderRadius: 50,
                          }}
                          borderless
                        >
                          <Feather
                            name="trash-2"
                            size={24}
                            color={theme.colors.error}
                          />
                        </TouchableRipple>
                      )}
                    </View>

                    {item.type === "VIDEO" ? (
                      <VideoPlayer videoSource={item.url} />
                    ) : (
                      <Image source={{ uri: item.url }} style={{ flex: 1 }} />
                    )}
                  </View>
                ))}
              </PagerView>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
