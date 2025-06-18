import { View, StyleSheet, FlatList } from "react-native";
import {
  ActivityIndicator,
  Button,
  Checkbox,
  Dialog,
  Divider,
  FAB,
  Modal,
  Portal,
  Searchbar,
  TextInput,
  Text,
  useTheme,
  Banner,
} from "react-native-paper";
import { useI18nContext } from "@/i18n/i18n-react";
import { useAuthStore } from "@/lib/stores/authStore";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { xiorInstance } from "@/lib/fetcher";
import { useInfiniteQuery } from "@tanstack/react-query";
import Slider from "@react-native-community/slider";
import * as Location from "expo-location";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Controller, useForm } from "react-hook-form";
import PropertyCard from "@/components/property/PropertyCard";
import { Dropdown } from "react-native-paper-dropdown";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useIsFocused } from "@react-navigation/native";
import { PropertyCardSkeleton } from "@/components/property/Skeleton";
import Animated, { BounceInDown, SlideInDown } from "react-native-reanimated";

export default function HomeScreen() {
  const theme = useTheme();
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";
  const roles = useAuthStore((state) => state.session?.roles);
  const isFocused = useIsFocused();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 500);
  const [distanceValue, setDistanceValue] = useState(0);
  const [tempDistanceValue, setTempDistanceValue] = useState(0);

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>({ latitude: 31.12494637807097, longitude: 33.797963596880436 });

  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isDistanceChecked, setIsDistanceChecked] = useState(false);

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [rooms, setRooms] = useState("");
  const [area, setArea] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      minPrice: "",
      maxPrice: "",
      rooms: "",
      area: "",
    },
    resolver: zodResolver(
      z
        .object({
          minPrice: z
            .string()
            .regex(/^[0-9]*$/)
            .optional()
            .default(""),
          maxPrice: z
            .string()
            .regex(/^[0-9]*$/)
            .optional()
            .default(""),
          rooms: z
            .string()
            .regex(/^[0-9]*$/)
            .transform(Number)
            .optional()
            .default(""),
          area: z
            .string()
            .regex(/^[0-9]*$/)
            .transform(Number)
            .optional()
            .default(""),
        })
        .refine(
          (data) => {
            const hasMin = data.minPrice && data.minPrice !== "";
            const hasMax = data.maxPrice && data.maxPrice !== "";
            return (hasMin && hasMax) || (!hasMin && !hasMax);
          },
          {
            message:
              "Both min and max price must be provided together, or leave both empty",
            path: ["minPrice"],
          },
        )
        .transform((data) => ({
          ...data,
          minPrice: data.minPrice !== "" ? Number(data.minPrice) : undefined,
          maxPrice: data.maxPrice !== "" ? Number(data.maxPrice) : undefined,
        })),
    ),
  });

  const [sortBy, setSortBy] = useState<string | undefined>();
  const [sortByOptions] = useState([
    { label: LL.SORT_BY_PRICE(), value: "price" },
    { label: LL.SORT_BY_CREATION_DATE(), value: "created_at" },
  ]);

  const [order, setOrder] = useState<string | undefined>();
  const [orderOptions] = useState([
    { label: LL.ASCENDING(), value: "asc" },
    { label: LL.DESCENDING(), value: "desc" },
  ]);

  const [type, setType] = useState<string | undefined>();
  const typeOptions = useMemo(
    () => [
      { label: LL.APARTMENT_LABEL(), value: "APARTMENT" },
      { label: LL.HOUSE_LABEL(), value: "HOUSE" },
      { label: LL.LAND_LABEL(), value: "LAND" },
      { label: LL.COASTAL(), value: "COASTAL" },
      { label: LL.COMMERCIAL_LABEL(), value: "COMMERCIAL" },
    ],
    [LL],
  );

  const [status, setStatus] = useState<string | undefined>();
  const statusOptions = useMemo(
    () => [
      { label: LL.AVAILABLE_LABEL(), value: "AVAILABLE" },
      { label: LL.RENTED_LABEL(), value: "RENTED" },
      { label: LL.SOLD_LABEL(), value: "SOLD" },
    ],
    [LL],
  );

  const [shouldRefetch, setShouldRefetch] = useState(false);

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
        debouncedQuery,
        minPrice,
        maxPrice,
        distanceValue,
        sortBy,
        order,
        type,
        status,
        rooms,
        area,
      },
    ],

    queryFn: async (input) => {
      let params: {
        searchTerm?: string;
        limit: number;
        cursor?: number;
        cursorCreatedAt?: string;
        latitude?: number;
        longitude?: number;
        radius?: number;
        minPrice?: string;
        maxPrice?: string;
        sortBy?: string;
        order?: string;
        type?: string;
        status?: string;
        rooms?: string;
        area?: string;
      } = {
        limit: 10,
        cursor: input.pageParam.cursor,
      };

      if (debouncedQuery.length > 0) {
        params = {
          ...params,
          searchTerm: debouncedQuery,
        };
      } else if (isDistanceChecked && location && distanceValue > 0) {
        params = {
          ...params,
          latitude: location.latitude,
          longitude: location.longitude,
          radius: distanceValue,
        };
      } else {
        params = {
          ...params,
          cursor: input.pageParam.cursor,
        };
        if (input.pageParam.cursorCreatedAt) {
          params = {
            ...params,
            cursorCreatedAt: input.pageParam.cursorCreatedAt,
          };
        }
      }

      if (minPrice && maxPrice) {
        params.minPrice = minPrice;
        params.maxPrice = maxPrice;
      }

      if (type) params.type = type;
      if (status) params.status = status;

      if (rooms) params.rooms = rooms;
      if (area) params.area = area;

      if (sortBy) params.sortBy = sortBy;
      if (order) params.order = order;

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

  const [isGrantedErrorDialogVisible, setIsGrantedErrorDialogVisible] =
    useState(false);

  useEffect(() => {
    const fetchLocationAndRefetch = async () => {
      if (!location && !isLoadingLocation) {
        setIsLoadingLocation(true);

        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            setIsGrantedErrorDialogVisible(true);
            return;
          }

          const loc = await Location.getCurrentPositionAsync();
          setLocation(loc.coords);
        } catch {
          setErrorDialogVisible(true);
        } finally {
          setIsLoadingLocation(false);
          refetch();
        }
      } else {
        refetch();
      }
    };

    if (shouldRefetch) {
      setShouldRefetch(false);
      if (isDistanceChecked) {
        fetchLocationAndRefetch();
      } else {
        refetch();
      }
    }
  }, [shouldRefetch, isDistanceChecked, isLoadingLocation, location, refetch]);

  const [isFiltersModalVisible, setIsFiltersModalVisible] = useState(false);
  const showModal = () => setIsFiltersModalVisible(true);
  const hideModal = () => setIsFiltersModalVisible(false);

  const onSubmit = (data: any) => {
    setMinPrice(data.minPrice);
    setMaxPrice(data.maxPrice);
    setRooms(data.rooms);
    setArea(data.area);
    setDistanceValue(tempDistanceValue);
    setShouldRefetch(true);
    hideModal();
  };

  const handleApplyFilters = () => {
    handleSubmit(onSubmit)();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Animated.View
        style={{
          flexDirection: "row",
          marginHorizontal: 16,
          gap: 8,
        }}
        entering={BounceInDown}
      >
        <Searchbar
          style={{ flex: 1, marginTop: 16 }}
          placeholder={LL.SEARCH_FOR_PROPERTIES()}
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={() => refetch()}
        />

        <MaterialCommunityIcons
          style={{ alignSelf: "center" }}
          name="filter"
          size={34}
          color={theme.colors.primary}
          onPress={showModal}
        />
      </Animated.View>

      <Portal>
        <Modal
          visible={isFiltersModalVisible}
          onDismiss={hideModal}
          contentContainerStyle={{
            flex: 1,
            backgroundColor: theme.colors.surface,
            padding: 20,
            margin: 20,
            borderRadius: 10,
          }}
        >
          <View
            style={{
              marginVertical: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                gap: 8,
              }}
            >
              <Controller
                name="minPrice"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder={LL.MINIMUM_PRICE()}
                    keyboardType="numeric"
                    style={{ flex: 1 }}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              <Controller
                name="maxPrice"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder={LL.MAXIMUM_PRICE()}
                    keyboardType="numeric"
                    style={{ flex: 1 }}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
            </View>

            {errors.minPrice || errors.maxPrice ? (
              <Text
                style={{
                  color: theme.colors.error,
                  alignSelf: "center",
                  marginVertical: 8,
                }}
              >
                {errors.minPrice?.message || errors.maxPrice?.message}
              </Text>
            ) : null}

            <View
              style={{
                flexDirection: "row",
                marginVertical: 8,
                gap: 8,
              }}
            >
              <Controller
                name="rooms"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder={LL.ROOMS_COUNT()}
                    keyboardType="numeric"
                    style={{ flex: 1 }}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.rooms ? (
                <Text
                  style={{
                    color: theme.colors.error,
                    alignSelf: "center",
                    marginVertical: 8,
                  }}
                >
                  {errors.rooms?.message}
                </Text>
              ) : null}
              <Controller
                name="area"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    placeholder={LL.AREA()}
                    keyboardType="numeric"
                    style={{ flex: 1 }}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.area ? (
                <Text
                  style={{
                    color: theme.colors.error,
                    alignSelf: "center",
                    marginVertical: 8,
                  }}
                >
                  {errors.area?.message}
                </Text>
              ) : null}
            </View>

            <View style={{ gap: 8, marginVertical: 8 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  marginHorizontal: "auto",
                }}
              >
                {LL.SORT_BY()}
              </Text>
              <Dropdown
                label={LL.SORT_BY()}
                options={sortByOptions}
                value={sortBy}
                onSelect={setSortBy}
              />

              <View style={{ width: "100%", flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Dropdown
                    label={LL.PROPERTY_STATUS()}
                    options={statusOptions}
                    value={status}
                    onSelect={setStatus}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Dropdown
                    label={LL.PROPERTY_TYPE()}
                    options={typeOptions}
                    value={type}
                    onSelect={setType}
                  />
                </View>
              </View>

              <Dropdown
                label={LL.ORDER_BY()}
                options={orderOptions}
                value={order}
                onSelect={setOrder}
              />
            </View>
          </View>

          <Divider style={{ marginVertical: 20 }} />

          <Text
            style={{
              textAlign: "center",
              color: theme.colors.secondary,
            }}
          >
            {tempDistanceValue > 0
              ? LL.FIND_A_PROPERTY_X_KM_AWAY({ distance: tempDistanceValue })
              : LL.FIND_A_PROPERTY_NEARBY()}
          </Text>

          <View style={{ flexDirection: "row" }}>
            <Slider
              disabled={!isDistanceChecked}
              style={{ flex: 1 }}
              value={distanceValue}
              minimumValue={0}
              maximumValue={50}
              onValueChange={(value) => {
                setTempDistanceValue(Math.round(value));
              }}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.secondary}
              thumbTintColor={theme.colors.primary}
            />

            <Checkbox
              status={isDistanceChecked ? "checked" : "unchecked"}
              onPress={() => {
                setIsDistanceChecked(!isDistanceChecked);
                setTempDistanceValue(0);
              }}
            />
          </View>

          <Button mode="contained" onPress={handleApplyFilters}>
            {LL.APPLY_FILTERS()}
          </Button>
        </Modal>
      </Portal>

      <Banner
        visible={isError && !isFetching}
        style={{
          backgroundColor: theme.colors.errorContainer,
          marginVertical: 8,
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

      <Portal>
        <Dialog
          visible={errorDialogVisible}
          onDismiss={() => setErrorDialogVisible(false)}
        >
          <Dialog.Title style={{ textAlign: forceRTL ? "right" : "left" }}>
            {LL.LOCATION_SERVICE_ERROR()}
          </Dialog.Title>
          <Dialog.Content>
            <Text
              style={{ textAlign: forceRTL ? "right" : "left" }}
              variant="bodyMedium"
            >
              {LL.COULD_NOT_GET_YOUR_LOCATION()}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setErrorDialogVisible(false)}>
              {LL.OK()}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={isGrantedErrorDialogVisible}
          onDismiss={() => setIsGrantedErrorDialogVisible(false)}
        >
          <Dialog.Title style={{ textAlign: forceRTL ? "right" : "left" }}>
            {LL.LOCATION_PERMISSION_REQUIRED()}
          </Dialog.Title>
          <Dialog.Content>
            <Text
              style={{ textAlign: forceRTL ? "right" : "left" }}
              variant="bodyMedium"
            >
              {LL.COULD_NOT_GET_YOUR_LOCATION()}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsGrantedErrorDialogVisible(false)}>
              {LL.OK()}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {isLoadingLocation ? (
        <ActivityIndicator color={theme.colors.primary} size="small" />
      ) : null}

      {isLoading ? (
        <View style={{ flex: 1, gap: 8 }}>
          {Array(5)
            .fill(null)
            .map((_, index) => (
              <PropertyCardSkeleton key={index} isLoading />
            ))}
        </View>
      ) : (
        <FlatList
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

      {roles?.includes("ADMIN") || roles?.includes("AGENT") ? (
        <Animated.View entering={SlideInDown}>
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={() => router.push("/property/add")}
          />
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
