import React, { memo, useMemo, useCallback } from "react";
import { useCurrentUser } from "@/lib/queries/user";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { ActivityIndicator, useTheme } from "react-native-paper";
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useI18nContext } from "@/i18n/i18n-react";
import { truncateContent } from "@/lib/helpers";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 50;
const REPLY_THRESHOLD = 100;
const SPRING_CONFIG = { damping: 15, stiffness: 150 };
const TIMING_CONFIG = { duration: 200 };
const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };
const INTERPOLATE_INPUT = [0, REPLY_THRESHOLD];
const INTERPOLATE_OUTPUT_OPACITY = [0, 1];
const INTERPOLATE_OUTPUT_SCALE = [0.5, 1];

interface SwipeableMessageProps {
  item: Message;
  retryMessage: (message: Message) => void;
  onReply?: (message: Message) => void;
  replyToMessage?: Message | null;
  otherUserName?: string;
  onGoToMessage?: (messageId: string) => void;
  isHighlighted?: boolean;
  onLongPressMessage: (messageId: Message["id"]) => void;
}

const ReplyIcon = memo(({ style }: { style: any }) => (
  <Animated.View style={style}>
    <Ionicons name="arrow-undo" size={16} color="white" />
  </Animated.View>
));
ReplyIcon.displayName = "ReplyIcon";

const RetryButton = memo(
  ({ onPress, color }: { onPress: () => void; color: string }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.retryButton}
      hitSlop={HIT_SLOP}
    >
      <Ionicons name="refresh" size={16} color={color} />
    </TouchableOpacity>
  ),
);
RetryButton.displayName = "RetryButton";

const LoadingIndicator = memo(({ color }: { color: string }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="small" color={color} />
  </View>
));
LoadingIndicator.displayName = "LoadingIndicator";

const ReplyContainer = memo(
  ({
    onPress,
    style,
    authorName,
    authorColor,
    content,
    contentColor,
  }: {
    onPress: () => void;
    style: any;
    authorName: string;
    authorColor: string;
    content: string;
    contentColor: string;
  }) => (
    <TouchableOpacity onPress={onPress} style={style} activeOpacity={0.7}>
      <Text style={[styles.replyAuthor, { color: authorColor }]}>
        {authorName}
      </Text>
      <Text
        style={[styles.replyText, { color: contentColor }]}
        numberOfLines={2}
      >
        {content}
      </Text>
    </TouchableOpacity>
  ),
);
ReplyContainer.displayName = "ReplyContainer";

const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString(["en-US"], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export default memo(
  function SwipeableMessage({
    item,
    retryMessage,
    onReply,
    replyToMessage,
    otherUserName,
    onGoToMessage,
    isHighlighted = false,
    onLongPressMessage,
  }: SwipeableMessageProps) {
    const { data: currentUser } = useCurrentUser();
    const theme = useTheme();
    const { LL } = useI18nContext();

    const translateX = useSharedValue(0);
    const opacity = useSharedValue(0);

    const messageState = useMemo(
      () => ({
        isMe: item.senderId === currentUser?.id,
        isFailed: item._status === "FAILED",
        isSending: item._status === "SENDING",
        hasReply: Boolean(replyToMessage),
        formattedTime: formatTime(item.createdAt),
      }),
      [
        item.senderId,
        item._status,
        item.createdAt,
        currentUser?.id,
        replyToMessage,
      ],
    );

    const themeColors = useMemo(
      () => ({
        primary: theme.colors.primary,
        onPrimary: theme.colors.onPrimary,
        error: theme.colors.error,
        onError: theme.colors.onError,
        secondaryContainer: theme.colors.secondaryContainer,
        onSecondaryContainer: theme.colors.onSecondaryContainer,
        primaryContainer: theme.colors.primaryContainer,
        tertiaryContainer: theme.colors.tertiaryContainer,
      }),
      [theme.colors],
    );

    const messageStyles = useMemo(() => {
      let backgroundColor = themeColors.secondaryContainer;

      if (messageState.isMe) {
        if (messageState.isFailed) {
          backgroundColor = themeColors.error;
        } else if (messageState.isSending) {
          backgroundColor = themeColors.secondaryContainer;
        } else {
          backgroundColor = themeColors.primary;
        }
      }

      if (isHighlighted) {
        backgroundColor = messageState.isMe
          ? themeColors.primaryContainer
          : themeColors.tertiaryContainer;
      }

      const baseStyles = [
        styles.messageBubble,
        { backgroundColor },
        messageState.isMe && styles.myMessage,
      ];

      // @ts-ignore
      if (isHighlighted) baseStyles.push(styles.highlightedMessage);

      return baseStyles;
    }, [messageState, isHighlighted, themeColors]);

    const textColors = useMemo(() => {
      let mainColor = themeColors.onSecondaryContainer;

      if (messageState.isMe) {
        if (messageState.isFailed) {
          mainColor = themeColors.onError;
        } else if (!messageState.isSending) {
          mainColor = themeColors.onPrimary;
        }
      }

      return {
        main: mainColor,
        replyAuthor: messageState.isMe
          ? themeColors.onPrimary
          : themeColors.primary,
      };
    }, [messageState, themeColors]);

    const replyContainerStyle = useMemo(
      () => [
        styles.replyContainer,
        {
          borderLeftColor: messageState.isMe
            ? themeColors.onPrimary
            : themeColors.primary,
          backgroundColor: messageState.isMe
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.05)",
        },
      ],
      [messageState.isMe, themeColors],
    );

    const replyData = useMemo(() => {
      if (!replyToMessage) return null;

      return {
        content: truncateContent(replyToMessage.content),
        authorName:
          replyToMessage.senderId === currentUser?.id
            ? LL.YOU()
            : otherUserName || LL.USER(),
      };
    }, [replyToMessage, currentUser?.id, otherUserName, LL]);

    const triggerReply = useCallback(() => {
      onReply?.(item);
    }, [onReply, item]);

    const handleReplyPress = useCallback(() => {
      if (replyToMessage?.id && onGoToMessage) {
        onGoToMessage(replyToMessage.id);
      }
    }, [replyToMessage?.id, onGoToMessage]);

    const handleRetry = useCallback(() => {
      retryMessage(item);
    }, [retryMessage, item]);

    const triggerHaptic = useCallback(() => {
      Haptics.selectionAsync();
    }, []);

    const pan = Gesture.Pan()
      .minDistance(4)
      .activeOffsetX([-10, 10])
      .failOffsetY([-10, 10])
      .onStart(() => {
        runOnJS(triggerHaptic)();
      })
      .onUpdate((event) => {
        const absX = Math.abs(event.translationX);
        const absY = Math.abs(event.translationY);

        if (absX <= absY * 2) return;

        const clampedX = Math.min(
          Math.max(0, event.translationX),
          REPLY_THRESHOLD,
        );
        translateX.value = clampedX;

        opacity.value = interpolate(
          clampedX,
          INTERPOLATE_INPUT,
          INTERPOLATE_OUTPUT_OPACITY,
          Extrapolate.CLAMP,
        );
      })
      .onEnd((event) => {
        const absX = Math.abs(event.translationX);
        const absY = Math.abs(event.translationY);

        if (absX <= absY * 2) return;

        const finalTranslateX = Math.max(0, event.translationX);

        if (finalTranslateX > SWIPE_THRESHOLD) {
          runOnJS(triggerReply)();
        }

        translateX.value = withSpring(0, SPRING_CONFIG);
        opacity.value = withTiming(0, TIMING_CONFIG);
      });

    const longPress = Gesture.LongPress()
      .minDuration(500)
      .onStart(() => {
        runOnJS(triggerHaptic)();
        runOnJS(onLongPressMessage)(item.id);
      });

    const gesture = Gesture.Simultaneous(pan, longPress);
    const messageAnimatedStyle = useAnimatedStyle(
      () => ({
        transform: [{ translateX: translateX.value }],
      }),
      [],
    );

    const replyIconAnimatedStyle = useAnimatedStyle(
      () => ({
        opacity: opacity.value,
        transform: [
          {
            scale: interpolate(
              opacity.value,
              INTERPOLATE_OUTPUT_OPACITY,
              INTERPOLATE_OUTPUT_SCALE,
              Extrapolate.CLAMP,
            ),
          },
        ],
      }),
      [],
    );

    return (
      <View style={styles.container}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={styles.messageRow}>
            {/* Reply Icon */}
            <ReplyIcon style={[styles.replyIcon, replyIconAnimatedStyle]} />

            {/* Message Container */}
            <Animated.View style={[messageStyles, messageAnimatedStyle]}>
              <View>
                {/* Reply Container */}
                {messageState.hasReply && replyData && (
                  <ReplyContainer
                    onPress={handleReplyPress}
                    style={replyContainerStyle}
                    authorName={replyData.authorName}
                    authorColor={textColors.replyAuthor}
                    content={replyData.content}
                    contentColor={textColors.main}
                  />
                )}

                {/* Main Message Content */}
                <Text
                  style={[
                    styles.messageText,
                    {
                      color: textColors.main,
                      marginTop: messageState.hasReply ? 8 : 0,
                    },
                  ]}
                >
                  {item.content}
                </Text>

                {/* Timestamp and Status */}
                <View style={styles.timestampContainer}>
                  <Text style={[styles.timestamp, { color: textColors.main }]}>
                    {messageState.formattedTime}
                  </Text>

                  {messageState.isFailed && messageState.isMe && (
                    <RetryButton
                      onPress={handleRetry}
                      color={themeColors.onError}
                    />
                  )}

                  {messageState.isSending && messageState.isMe && (
                    <LoadingIndicator
                      color={themeColors.onSecondaryContainer}
                    />
                  )}
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </View>
    );
  },
  (prevProps, nextProps) => {
    const itemChanged =
      prevProps.item.id !== nextProps.item.id ||
      prevProps.item.content !== nextProps.item.content ||
      prevProps.item._status !== nextProps.item._status ||
      prevProps.item.createdAt !== nextProps.item.createdAt ||
      prevProps.item.senderId !== nextProps.item.senderId;

    const propsChanged =
      prevProps.isHighlighted !== nextProps.isHighlighted ||
      prevProps.otherUserName !== nextProps.otherUserName ||
      prevProps.replyToMessage?.id !== nextProps.replyToMessage?.id ||
      prevProps.replyToMessage?.content !== nextProps.replyToMessage?.content ||
      prevProps.onLongPressMessage !== nextProps.onLongPressMessage;

    return !itemChanged && !propsChanged;
  },
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  replyIcon: {
    position: "absolute",
    left: 20,
    zIndex: 1,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  messageBubble: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    maxWidth: SCREEN_WIDTH * 0.8,
  },
  myMessage: {
    marginLeft: "auto",
  },
  highlightedMessage: {
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
    opacity: 0.7,
  },
  retryButton: {
    padding: 4,
    marginLeft: 8,
  },
  loadingContainer: {
    marginLeft: 8,
  },
  replyContainer: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 4,
    paddingRight: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  replyAuthor: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  replyText: {
    fontSize: 13,
    opacity: 0.8,
    fontStyle: "italic",
  },
});
