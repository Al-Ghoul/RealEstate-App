import {
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { StyleSheet, TouchableOpacity } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";

export default function LocationPicker({
  markerPosition,
  setMarkerPosition,
  children,
}: {
  markerPosition: LocationType | undefined;
  setMarkerPosition: Dispatch<SetStateAction<LocationType>>;
  children?: ReactNode;
}) {
  const mapRef = useRef<MapView>(null);
  const [initialCoords, setInitialCoords] = useState({
    latitude: 31.1249,
    longitude: 33.798,
  });
  const [loadingLocation, setLoadingLocation] = useState(false);

  const goToMyLocation = async () => {
    if (loadingLocation) return;

    setLoadingLocation(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission denied");
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
      alert("Failed to get location");
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

      {children}

      <TouchableOpacity
        style={[styles.gpsButton, loadingLocation && styles.disabledBtn]}
        onPress={goToMyLocation}
        disabled={loadingLocation}
      >
        {loadingLocation ? (
          <ActivityIndicator size="small" color="#007bff" />
        ) : (
          <Text style={styles.gpsText}>📍 My Location</Text>
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
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  gpsText: {
    fontWeight: "bold",
    color: "#007bff",
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
