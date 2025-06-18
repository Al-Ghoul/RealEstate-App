import { useTheme } from "react-native-paper";
import Skeleton from "react-native-reanimated-skeleton";
import { StyleSheet } from "react-native";

interface SkeletonProps {
  isLoading: boolean;
}

export default function ChatItemSkeleton({ isLoading }: SkeletonProps) {
  const theme = useTheme();
  return (
    <Skeleton
      isLoading={isLoading}
      animationDirection="diagonalTopLeft"
      containerStyle={[
        styles.swipeable,
        { backgroundColor: theme.colors.secondaryContainer },
      ]}
      layout={[
        {
          key: "chat-container",
          flexDirection: "row",
          padding: 14,
          alignItems: "center",
          children: [
            {
              key: "chat-avatar",
              ...styles.avatar,
              backgroundColor: theme.colors.onSecondaryContainer,
            },
            {
              key: "chat-content",
              ...styles.content,
              children: [
                {
                  key: "chat-header",
                  ...styles.header,
                  children: [
                    {
                      key: "chat-name",
                      ...styles.nameText,
                      backgroundColor: theme.colors.onSecondaryContainer,
                      width: 40,
                      height: 10,
                    },
                    {
                      key: "chat-timestamp",
                      ...styles.timestampText,
                      backgroundColor: theme.colors.onSecondaryContainer,
                      width: 40,
                      height: 10,
                    },
                  ],
                },
                {
                  key: "chat-message",
                  ...styles.messageText,
                  backgroundColor: theme.colors.onSecondaryContainer,
                  width: 200,
                  height: 10,
                },
              ],
            },
          ],
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  swipeable: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  nameText: {
    fontWeight: "600",
    fontSize: 15,
  },
  timestampText: {
    fontSize: 12,
  },
  messageText: {
    fontSize: 14,
  },
});
