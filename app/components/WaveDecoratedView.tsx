import type { ReactNode } from "react";
import { Dimensions, View, type ViewStyle } from "react-native";
import { useTheme } from "react-native-paper";
import Svg, { Path } from "react-native-svg";

interface GenericViewProps {
  children: ReactNode;
  style?: ViewStyle;
}

export default function WaveDecoratedView({
  children,
  style,
}: GenericViewProps) {
  const theme = useTheme();
  const originalWidth = 1440;
  const originalHeight = 320;
  const windowWidth = Dimensions.get("window").width;
  const aspectRatio = originalWidth / originalHeight;
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        style,
      ]}
    >
      <View
        style={{
          width: windowWidth,
          aspectRatio,
          position: "absolute",
          bottom: 0,
        }}
      >
        <Svg
          viewBox={`0 0 ${originalWidth} ${originalHeight}`}
          width="100%"
          height="100%"
        >
          <Path
            fill={theme.colors.primary}
            d="m0 128 48-5.3c48-5.7 144-15.7 240 10.6C384 160 480 224 576 240s192-16 288-42.7c96-26.3 192-48.3 288-42.6 96 5.3 192 37.3 240 53.3l48 16v96H0Z"
          />
        </Svg>
      </View>
      {children}
    </View>
  );
}
