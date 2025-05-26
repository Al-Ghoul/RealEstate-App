import {
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Dialog,
  Text,
  useTheme,
} from "react-native-paper";
import { useI18nContext } from "@/i18n/i18n-react";
import Entypo from "@expo/vector-icons/Entypo";

export default function LocationPicker({
  markerPosition,
  setMarkerPosition,
  children,
}: {
  markerPosition: LocationType | undefined;
  setMarkerPosition: Dispatch<SetStateAction<LocationType>>;
  children?: ReactNode;
}) {
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);
  const [initialCoords, setInitialCoords] = useState({
    latitude: 31.1249,
    longitude: 33.798,
  });
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [
    isLocationNotGrantedErrorVisible,
    setIsLocationNotGrantedErrorVisible,
  ] = useState(false);
  const [
    isLocationNotAvailableErrorVisible,
    setIsLocationNotAvailableErrorVisible,
  ] = useState(false);

  const goToMyLocation = async () => {
    if (loadingLocation) return;

    setLoadingLocation(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setIsLocationNotGrantedErrorVisible(true);
        return;
      }

      const loc = await Location.getCurrentPositionAsync();
      const { latitude, longitude } = loc.coords;

      setInitialCoords({ latitude, longitude });
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch {
      setIsLocationNotAvailableErrorVisible(true);
    } finally {
      setLoadingLocation(false);
    }
  };

  return (
    <>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: initialCoords.latitude,
          longitude: initialCoords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          setMarkerPosition({ x: latitude, y: longitude });
        }}
      >
        <Marker
          coordinate={{
            latitude: markerPosition?.x ?? 0,
            longitude: markerPosition?.y ?? 0,
          }}
        />
      </MapView>

      <Dialog visible={isLocationNotGrantedErrorVisible}>
        <Dialog.Title style={{ textAlign: forceRTL ? "right" : "left" }}>
          {LL.LOCATION_PERMISSION_DENIED()}
        </Dialog.Title>
        <Dialog.Content>
          <Text
            variant="bodyMedium"
            style={{ textAlign: forceRTL ? "right" : "left" }}
          >
            {LL.LOCATION_PERMISSION_DENIED_DETAIL()}
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setIsLocationNotGrantedErrorVisible(false)}>
            {LL.OK()}
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog visible={isLocationNotAvailableErrorVisible}>
        <Dialog.Title style={{ textAlign: forceRTL ? "right" : "left" }}>
          {LL.FAILED_TO_GET_YOUR_LOCATION()}
        </Dialog.Title>
        <Dialog.Content>
          <Text
            variant="bodyMedium"
            style={{ textAlign: forceRTL ? "right" : "left" }}
          >
            {LL.PLEASE_TRY_AGAIN_LATER()}
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setIsLocationNotAvailableErrorVisible(false)}>
            {LL.OK()}
          </Button>
        </Dialog.Actions>
      </Dialog>

      {children}

      <TouchableOpacity
        style={[
          styles.gpsButton,
          loadingLocation && styles.disabledBtn,
          {
            backgroundColor: theme.colors.primary,
          },
        ]}
        onPress={goToMyLocation}
        disabled={loadingLocation}
      >
        {loadingLocation ? (
          <ActivityIndicator size="small" color={theme.colors.onPrimary} />
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Entypo
              name="location-pin"
              size={24}
              color={theme.colors.onPrimary}
            />
            <Text variant="bodyLarge" style={{ color: theme.colors.onPrimary }}>
              {LL.GO_TO_MY_LOCATION()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  gpsButton: {
    position: "absolute",
    top: 40,
    right: 20,
    padding: 10,
    borderRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
