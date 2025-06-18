import type { ViewStyle } from "react-native";
import { useTheme } from "react-native-paper";
import Skeleton from "react-native-reanimated-skeleton";

export const ProfileImageSkeleton = ({
  isLoading,
  style,
}: {
  isLoading: boolean;
  style?: ViewStyle;
}) => {
  const theme = useTheme();

  return (
    <Skeleton
      animationDirection="diagonalTopLeft"
      isLoading={isLoading}
      boneColor={theme.colors.onBackground}
      highlightColor={theme.colors.background}
      layout={[
        {
          key: "pfp",
          width: 28,
          height: 28,
          ...style,
          borderRadius: 50,
        },
      ]}
    />
  );
};

export const UserProfileSkeleton = ({ isLoading }: { isLoading: boolean }) => {
  const theme = useTheme();

  return (
    <Skeleton
      animationDirection="diagonalTopLeft"
      isLoading={isLoading}
      boneColor={theme.colors.onBackground}
      highlightColor={theme.colors.background}
      containerStyle={{
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
      }}
      layout={[
        {
          key: "pfp",
          width: 48,
          height: 48,
          borderRadius: 50,
        },
        {
          key: "user-full-name",
          children: [{ key: "bio", width: 80, height: 10, borderRadius: 10 }],
        },
      ]}
    />
  );
};

export function ProfileSkeleton({ isLoading }: { isLoading: boolean }) {
  const theme = useTheme();

  return (
    <Skeleton
      animationDirection="diagonalTopLeft"
      isLoading={isLoading}
      boneColor={theme.colors.onBackground}
      highlightColor={theme.colors.background}
      containerStyle={{
        flex: 1,
        flexDirection: "row",
        justifyContent: "center",
        gap: 4,
      }}
      layout={[
        {
          key: "pfp",
          width: 64,
          height: 64,
          borderRadius: 50,
        },
        {
          key: "user-full-name",
          children: [
            { key: "bio", width: 150, height: 15, borderRadius: 10 },
            {
              key: "other",
              width: 250,
              height: 40,
              marginTop: 8,
              justifyContent: "center",
            },
          ],
        },
      ]}
    />
  );
}
