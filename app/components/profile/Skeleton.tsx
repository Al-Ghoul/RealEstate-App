import ContentLoader, {
  Rect,
  IContentLoaderProps,
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
      <Rect width={96} height={96} fill="#fff" rx={48} />
      <Rect width={96} height={9} x={120} y={8} fill="#D9D9D9" rx={4.5} />
      <Rect width={300} height={58} x={120} y={25} fill="#D9D9D9" rx={5} />
    </ContentLoader>
  );
};

export const ProfileImageSkeleton = () => {
  const theme = useTheme();
  const width = 96;
  const height = 96;
  const aspectRatio = width / height;

  return (
    <ContentLoader
      speed={1}
      backgroundColor={theme.colors.onBackground}
      foregroundColor="#999"
      viewBox={`0 0 ${width} ${height}`}
      style={{
        aspectRatio,
        borderRadius: 50,
      }}
    >
      <Rect width={width} height={height} fill="#fff" rx={48} />
    </ContentLoader>
  );
};
