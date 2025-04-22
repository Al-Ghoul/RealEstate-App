import { useColorScheme } from "nativewind";
import { Dimensions, View } from "react-native";
import Svg, { Path } from "react-native-svg";

interface GenericViewProps {
  children: React.ReactNode;
  className?: string;
}

export default function GenericView({ children, className }: GenericViewProps) {
  const { colorScheme } = useColorScheme();
  const originalWidth = 1440;
  const originalHeight = 320;
  const aspectRatio = originalWidth / originalHeight;
  const windowWidth = Dimensions.get("window").width;

  return (
    <View className={`flex-1 dark:bg-black bg-white ${className}`}>
      {children}
      <View style={{ width: windowWidth, aspectRatio }}>
        <Svg
          viewBox={`0 0 ${originalWidth} ${originalHeight}`}
          width="100%"
          height="100%"
        >
          <Path
            fill={colorScheme === "light" ? "#000" : "#fff"}
            d="m0 128 48-5.3c48-5.7 144-15.7 240 10.6C384 160 480 224 576 240s192-16 288-42.7c96-26.3 192-48.3 288-42.6 96 5.3 192 37.3 240 53.3l48 16v96H0Z"
          />
        </Svg>
      </View>
    </View>
  );
}
