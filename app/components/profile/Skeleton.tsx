import ContentLoader, {
  Rect,
  type IContentLoaderProps,
} from "react-content-loader/native";
import { useTheme } from "react-native-paper";

export const ProfileSkeleton = (props: IContentLoaderProps) => {
  const theme = useTheme();
  return (
    <ContentLoader
      width={420}
      height={96}
      speed={1}
      backgroundColor={theme.colors.onBackground}
      foregroundColor="#999"
      {...props}
    >
      <Rect width={96} height={96} rx={48} />
      <Rect width={96} height={9} x={120} y={8} rx={4.5} />
      <Rect width={300} height={58} x={120} y={25} rx={5} />
    </ContentLoader>
  );
};

export const ProfileImageSkeleton = () => {
  const theme = useTheme();
  const width = 96;
  const height = 96;

  return (
    <ContentLoader
      speed={1}
      backgroundColor={theme.colors.onBackground}
      foregroundColor="#999"
      viewBox={`0 0 ${width} ${height}`}
      style={{
        borderRadius: 50,
      }}
    >
      <Rect width={width} height={height} rx={48} />
    </ContentLoader>
  );
};

export const UserProfileSkeleton = () => {
  const theme = useTheme();
  const width = 152;
  const height = 48;

  return (
    <ContentLoader
      speed={1}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      backgroundColor={theme.colors.onBackground}
      foregroundColor="#999"
    >
      <Rect width={48} height={48} rx={24} />
      <Rect width={96} height={9} x={56} y={8} rx={4.5} />
    </ContentLoader>
  );
};
