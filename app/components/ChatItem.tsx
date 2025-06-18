import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Text, useTheme, Checkbox } from "react-native-paper";
import { View, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { useCurrentUser, useGetUserProfile } from "@/lib/queries/user";
import { formatChatTimestamp } from "@/lib/formatChatTimestamp";
import { router } from "expo-router";
import Reanimated, {
  type SharedValue,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  runOnJS,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useEffect } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import ChatItemSkeleton from "./chat/Skeleton";
import { useI18nContext } from "@/i18n/i18n-react";

interface ChatItemProps {
  item: Chat;
  isSelectionMode: boolean;
  isSelected: boolean;
  onLongPress: (chatId: string) => void;
  onSelect: (chatId: string) => void;
  setIsDeletionDialogVisible: ({
    visible,
    chatId,
  }: {
    visible: boolean;
    chatId: string;
  }) => void;
}

export default function ChatItem({
  item,
  isSelectionMode,
  isSelected,
  onLongPress,
  onSelect,
  setIsDeletionDialogVisible,
}: ChatItemProps) {
  const {
    data: otherUser,
    isLoading: isLoadingOtherUser,
    isFetching: isFetchingOtherUser,
  } = useGetUserProfile(item.otherUserId);
  const { data: currentUser } = useCurrentUser();
  const theme = useTheme();
  const scale = useSharedValue(1);

  const isSentByCurrentUser = item.lastMessageSenderId === currentUser?.id;

  useEffect(() => {
    scale.set(withSpring(1));
  }, [isSelected, isSelectionMode, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: isSelected
      ? withSpring(theme.colors.primaryContainer)
      : withSpring(
          item.unreadCount > 0
            ? theme.colors.surfaceVariant
            : theme.colors.surface,
        ),
  }));

  const handleTap = () => {
    if (isSelectionMode) {
      onSelect(item.chatId);
    } else {
      router.push(`/(chat)/${item.chatId}/chat`);
    }
  };

  const handleLongPress = () => {
    if (!isSelectionMode) {
      onLongPress(item.chatId);
    }
  };

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onStart(() => {
      scale.set(withSpring(0.98));
    })
    .onEnd(() => {
      scale.set(withSpring(1));
      runOnJS(handleTap)();
    })
    .onFinalize(() => {
      scale.set(withSpring(1));
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(300)
    .onStart(() => {
      scale.set(withSpring(0.95));
      runOnJS(handleLongPress)();
    })
    .onEnd(() => {
      scale.set(withSpring(1));
    })
    .onFinalize(() => {
      scale.set(withSpring(1));
    });

  const combinedGesture = Gesture.Race(longPressGesture, tapGesture);

  return (
    <Reanimated.View style={animatedStyle}>
      {!isSelectionMode ? (
        <ReanimatedSwipeable
          containerStyle={styles.swipeable}
          friction={2}
          enableTrackpadTwoFingerGesture
          rightThreshold={40}
          renderRightActions={RightAction(() => {
            setIsDeletionDialogVisible({
              visible: true,
              chatId: item.chatId,
            });
          })}
        >
          <GestureDetector gesture={combinedGesture}>
            <Reanimated.View style={styles.pressable}>
              {isLoadingOtherUser || isFetchingOtherUser ? (
                <ChatItemSkeleton isLoading />
              ) : (
                <ChatContent
                  item={item}
                  otherUser={otherUser!}
                  isSentByCurrentUser={isSentByCurrentUser}
                  isSelected={isSelected}
                  onSelect={onSelect}
                  isSelectionMode={isSelectionMode}
                />
              )}
            </Reanimated.View>
          </GestureDetector>
        </ReanimatedSwipeable>
      ) : (
        <GestureDetector gesture={combinedGesture}>
          <Reanimated.View style={[styles.swipeable, styles.pressable]}>
            {isLoadingOtherUser || isFetchingOtherUser ? (
              <ChatItemSkeleton isLoading />
            ) : (
              <ChatContent
                item={item}
                otherUser={otherUser!}
                isSentByCurrentUser={isSentByCurrentUser}
                isSelected={isSelected}
                onSelect={onSelect}
                isSelectionMode={isSelectionMode}
              />
            )}
          </Reanimated.View>
        </GestureDetector>
      )}
    </Reanimated.View>
  );
}

function RightAction(onDeletePress?: () => void) {
  const theme = useTheme();

  const RightActionComponent = (
    _prog: SharedValue<number>,
    drag: SharedValue<number>,
  ) => {
    const styleAnimation = useAnimatedStyle(() => {
      return {
        transform: [{ translateX: drag.get() + 70 }],
      };
    });

    return (
      <Reanimated.View style={styleAnimation}>
        <Pressable style={styles.rightAction} onPress={onDeletePress}>
          <Feather name="trash-2" size={30} color={theme.colors.error} />
        </Pressable>
      </Reanimated.View>
    );
  };

  RightActionComponent.displayName = "RightActionComponent";

  return RightActionComponent;
}

interface ChatContentProps {
  item: Chat;
  otherUser: Profile;
  isSentByCurrentUser: boolean;
  isSelected: boolean;
  onSelect: (chatId: Chat["chatId"]) => void;
  isSelectionMode: boolean;
}
const ChatContent = ({
  item,
  isSelectionMode,
  isSelected,
  onSelect,
  otherUser,
  isSentByCurrentUser,
}: ChatContentProps) => {
  const theme = useTheme();
  const { LL } = useI18nContext();

  return (
    <View style={styles.container}>
      {isSelectionMode && (
        <View style={styles.checkboxContainer}>
          <Checkbox
            status={isSelected ? "checked" : "unchecked"}
            onPress={() => onSelect(item.chatId)}
          />
        </View>
      )}

      <Image
        placeholder={otherUser?.imageBlurHash}
        source={otherUser?.image}
        style={[styles.avatar, isSelectionMode && styles.avatarWithCheckbox]}
        transition={500}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[
              styles.nameText,
              { color: theme.colors.onSecondaryContainer },
              isSelected && { color: theme.colors.onPrimaryContainer },
            ]}
          >
            {item.otherUserFullName}
          </Text>
          <Text
            style={[
              styles.timestampText,
              { color: theme.colors.onSecondaryContainer },
              isSelected && { color: theme.colors.onPrimaryContainer },
            ]}
          >
            {formatChatTimestamp(item.lastMessageCreatedAt)}
          </Text>
        </View>
        <Text
          style={[
            styles.messageText,
            isSentByCurrentUser && styles.sentText,
            {
              color: theme.colors.onSecondaryContainer,
            },
            isSelected && { color: theme.colors.onPrimaryContainer },
          ]}
        >
          {isSentByCurrentUser
            ? `${LL.YOU()}: ${item.lastMessageContent}`
            : item.lastMessageContent}
        </Text>
      </View>

      {item.unreadCount > 0 && !isSelected && (
        <View
          style={[
            styles.unreadBadge,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text variant="labelLarge" style={{ color: theme.colors.onPrimary }}>
            {item.unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rightAction: {
    flex: 1,
    width: 70,
    justifyContent: "center",
    alignItems: "center",
  },
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
  pressable: {
    flex: 1,
  },
  container: {
    flexDirection: "row",
    padding: 14,
    alignItems: "center",
  },
  checkboxContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarWithCheckbox: {
    marginRight: 8,
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
  sentText: {
    fontStyle: "italic",
  },
  unreadBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginLeft: 8,
  },
});
