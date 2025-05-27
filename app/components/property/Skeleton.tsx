import ContentLoader, {
  Rect,
  type IContentLoaderProps,
} from "react-content-loader/native";
import { Dimensions, View } from "react-native";
import { useTheme } from "react-native-paper";

export const PropertyCardSkeleton = (props: IContentLoaderProps) => {
  const theme = useTheme();
  const { width, height } = Dimensions.get("window");
  const aspectRatio = width / height;

  return (
    <View style={{ width: "100%", aspectRatio }}>
      <ContentLoader
        speed={1}
        backgroundColor={theme.colors.onBackground}
        foregroundColor="#999"
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        {...props}
      >
        <Rect width={96} height={9} y={237} rx={4.5} />
        <Rect width={58} height={16} x={13} y={292} rx={8} />
        <Rect width={58} height={16} x={85} y={292} rx={8} />
        <Rect width={58} height={16} x={157} y={292} rx={8} />
        <Rect width={58} height={16} x={229} y={292} rx={8} />
        <Rect width={width} height={9} y={214} rx={4.5} />
        <Rect width={width} height={18} y={260} rx={9} />
        <Rect width={width} height={200} rx={5} />
      </ContentLoader>
    </View>
  );
};
