import { Card, useTheme } from "react-native-paper";
import Skeleton from "react-native-reanimated-skeleton";

export function PropertyCardSkeleton({ isLoading }: { isLoading: boolean }) {
  const theme = useTheme();

  return (
    <Card
      style={{
        marginHorizontal: 16,
      }}
    >
      <Skeleton
        animationDirection="diagonalTopLeft"
        isLoading={isLoading}
        boneColor={theme.colors.onBackground}
        highlightColor={theme.colors.background}
        containerStyle={{}}
        layout={[
          {
            key: "card-image",
            width: "100%",
            height: 200,
            borderRadius: theme.roundness * 3,
          },
          {
            key: "card-content",
            width: "100%",
            height: 100,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginVertical: 6,
            marginHorizontal: 16,
            marginTop: 30,
            children: [
              {
                key: "type",
                width: 72,
                height: 30,
                borderRadius: theme.roundness * 2,
              },
              {
                key: "status",
                width: 72,
                height: 30,
                borderRadius: theme.roundness * 2,
              },
              {
                key: "area",
                width: 72,
                height: 30,
                borderRadius: theme.roundness * 2,
              },
              {
                key: "rooms",
                width: 72,
                height: 30,
                borderRadius: theme.roundness * 2,
              },
            ],
          },
        ]}
      />
    </Card>
  );
}
