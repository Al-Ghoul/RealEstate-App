import { useI18nContext } from "@/i18n/i18n-react";
import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Chip, Badge, useTheme } from "react-native-paper";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";

export default function PropertyCard({
  property,
  withLink,
}: {
  property: Property;
  withLink?: boolean;
}) {
  const theme = useTheme();
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";

  return (
    <Card
      style={styles.card}
      onPress={() => {
        if (withLink) {
          router.push(`/property/${property.id}`);
        }
      }}
    >
      <Card.Cover source={{ uri: property.thumbnailURL }} />
      <Card.Title
        style={{
          flexDirection: forceRTL ? "row-reverse" : "row",
        }}
        titleStyle={forceRTL ? { textAlign: "right" } : {}}
        title={property.title}
        right={() => (
          <Badge
            style={{
              color: "white",
              marginRight: 16,
              backgroundColor:
                property.status === "AVAILABLE" ? "#4CAF50" : "#FF9800",
            }}
          >
            {property.price}
          </Badge>
        )}
      />
      <Card.Content>
        <View style={styles.row}>
          <Chip
            icon={() => {
              switch (property.type) {
                case "APARTMENT":
                  return (
                    <MaterialIcons
                      name="apartment"
                      size={24}
                      color={theme.colors.primary}
                    />
                  );
                case "HOUSE":
                  return (
                    <FontAwesome6
                      name="house-chimney"
                      size={16}
                      color={theme.colors.primary}
                    />
                  );
                case "LAND":
                  return (
                    <MaterialIcons
                      name="terrain"
                      size={24}
                      color={theme.colors.primary}
                    />
                  );
                case "COASTAL":
                  return (
                    <MaterialCommunityIcons
                      name="island"
                      size={24}
                      color={theme.colors.primary}
                    />
                  );
                case "COMMERCIAL":
                  return (
                    <FontAwesome6
                      name="warehouse"
                      size={24}
                      color={theme.colors.primary}
                    />
                  );
              }
            }}
          >
            {
              // @ts-ignore
              LL[property.type.toUpperCase()]()
            }
          </Chip>
          <Chip icon="check-circle">
            {
              // @ts-ignore
              LL[property.status.toUpperCase()]()
            }
          </Chip>
          <Chip icon="ruler-square">{property.area} m²</Chip>
          <Chip icon="bed-double">
            {LL.ROOMS_COUNT_LABEL({ count: property.rooms })}
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 6,
  },
});
