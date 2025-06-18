import Ionicons from "@expo/vector-icons/Ionicons";
import {
  router,
  Tabs,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { memo, useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  Keyboard,
  type KeyboardEvent,
  Pressable,
} from "react-native";
import {
  ActivityIndicator,
  useTheme,
  Text,
  Card,
  Button,
} from "react-native-paper";
import { EmojiKeyboard } from "@abdoalghoul/react-native-emoji-keyboard";
import { FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import Graphemer from "graphemer";
import Animated, {
  LinearTransition,
  SlideInDown,
  SlideInUp,
  SlideOutDown,
  SlideOutUp,
} from "react-native-reanimated";
import {
  KeyboardGestureArea,
  KeyboardAvoidingView,
} from "react-native-keyboard-controller";
import { useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import { xiorInstance } from "@/lib/fetcher";
import { useIsFocused } from "@react-navigation/native";
import { useCurrentUser, useGetUserProfile } from "@/lib/queries/user";
import { queryClient } from "@/lib/client";
import { useWebSocketStore } from "@/lib/stores/useWebSocketStore";
import SwipeableMessage from "@/components/SwipeableMessage";
import TypingIndicator, {
  useReadReceiptsWithAppState,
} from "@/components/TypingIndicator";
import { useNavigationStore } from "@/lib/stores/navigationStore";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useI18nContext } from "@/i18n/i18n-react";
import { truncateContent } from "@/lib/helpers";

const BATCH_SIZE = 15;
const WINDOW_SIZE = 12;
const INITIAL_NUM_TO_RENDER = 20;
const END_REACHED_THRESHOLD = 0.3;
const ESTIMATED_ITEM_HEIGHT = 80;
const SCROLL_THRESHOLD = 20;

const MessageSearchIndicator = memo(
  ({ isVisible, theme }: { isVisible: boolean; theme: any }) => {
    if (!isVisible) return null;

    return (
      <View style={styles.searchIndicator}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={[styles.searchText, { color: theme.colors.onSurface }]}>
          Looking for message...
        </Text>
      </View>
    );
  },
);

MessageSearchIndicator.displayName = "MessageSearchIndicator";

const ReplyPreview = memo(
  ({
    replyingTo,
    theme,
    currentUser,
    otherUserProfile,
    onCancel,
  }: {
    replyingTo: Message | null;
    theme: any;
    currentUser: any;
    otherUserProfile: any;
    onCancel: () => void;
  }) => {
    if (!replyingTo) return null;

    return (
      <Animated.View
        style={[
          styles.replyPreview,
          {
            backgroundColor: theme.colors.surfaceVariant,
            borderTopColor: theme.colors.outline,
          },
        ]}
        entering={SlideInUp}
        exiting={SlideOutUp}
      >
        <View style={styles.replyContent}>
          <View
            style={[styles.replyBar, { backgroundColor: theme.colors.primary }]}
          />
          <View style={styles.replyText}>
            <Text
              style={[styles.replyUsername, { color: theme.colors.primary }]}
            >
              {replyingTo.senderId === currentUser?.id
                ? "You"
                : otherUserProfile?.firstName}
            </Text>
            <Text
              style={[styles.replyMessage, { color: theme.colors.onSurface }]}
              numberOfLines={2}
            >
              {truncateContent(replyingTo.content, 100)}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.cancelReplyButton} onPress={onCancel}>
          <Ionicons
            name="close"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

ReplyPreview.displayName = "ReplyPreview";

const LoadingMoreIndicator = () => {
  const { LL } = useI18nContext();
  return (
    <View style={styles.loadingMoreContainer}>
      <ActivityIndicator size="small" />
      <Text variant="bodySmall" style={styles.loadingMoreText}>
        {LL.LOADING_MORE_MESSAGES()}
      </Text>
    </View>
  );
};

const ErrorState = ({ onRetry }: { onRetry: () => void }) => {
  const { LL } = useI18nContext();
  return (
    <View style={styles.errorContainer}>
      <Card style={styles.errorCard}>
        <Card.Content style={styles.errorContent}>
          <Text variant="titleMedium" style={styles.errorTitle}>
            {LL.FAILED_TO_LOAD_MESSAGES()}
          </Text>
          <Text variant="bodyMedium" style={styles.errorMessage}>
            {LL.FAILED_TO_LOAD_MESSAGES_DETAIL()}
          </Text>
          <Button mode="contained" onPress={onRetry} style={styles.retryButton}>
            {LL.RETRY()}
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

export default function UserChatScreen() {
  const params = useLocalSearchParams<{
    id: string;
  }>();
  const { id } = params;
  const [input, setInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const isAtBottomRef = useRef(true);
  const theme = useTheme();
  const { LL } = useI18nContext();
  const [emojiVisible, setEmojiVisible] = useState(false);
  const splitter = useMemo(() => new Graphemer(), []);
  const isFocused = useIsFocused();
  const { data: currentUser } = useCurrentUser();
  const messageInputRef = useRef<TextInput>(null);
  const deleteInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const { otherUserId } = useMemo(() => {
    const splitIds = id.split("_");
    const otherId = splitIds[0] === currentUser?.id ? splitIds[1] : splitIds[0];
    return { otherUserId: otherId };
  }, [id, currentUser?.id]);

  const {
    data,
    isError,
    fetchNextPage,
    refetch,
    hasNextPage,
    isFetching,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["messages", id],
    queryFn: async (input) => {
      let params: {
        limit: number;
        cursor?: string;
        cursorCreatedAt?: string;
      } = {
        limit: 15,
        cursor: input.pageParam.cursor,
        cursorCreatedAt: input.pageParam.cursorCreatedAt,
      };

      const res = await xiorInstance.get(`/chats/${id}/messages`, {
        params,
      });

      return res.data;
    },
    initialPageParam: {
      cursor: undefined,
      cursorCreatedAt: undefined,
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta.has_next_page) return undefined;
      return {
        cursor: lastPage.meta.next_cursor,
        cursorCreatedAt: lastPage.meta.next_cursor_created_at,
      };
    },
    select: (data) => ({
      pages: data.pages.map((page) => page.data),
      pageParams: data.pageParams,
    }),
    subscribed: isFocused,
  });

  const allMessages = useMemo(() => {
    return data?.pages.flatMap((page) => page) ?? [];
  }, [data]);

  const { send } = useWebSocketStore();

  const pendingMessagesRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const sendMessageFN = useCallback(() => {
    if (!input.trim() || !currentUser?.id) return;

    const tempId = `temp-${Date.now()}`;
    const messageContent = input.trim();
    const replyId = replyingTo?.id;

    const optimisticMessage: Message = {
      id: tempId,
      chatId: id,
      senderId: currentUser.id,
      content: messageContent,
      createdAt: new Date().toISOString(),
      _status: "SENDING" as const,
      _tempId: tempId,
      replyToId: replyId,
    };

    queryClient.setQueryData<InfiniteData<{ data: Message[] }>>(
      ["messages", id],
      (oldData) => {
        if (!oldData) return oldData;

        const newPages = oldData.pages.map((page, index) => {
          if (index === 0) {
            return {
              ...page,
              data: [optimisticMessage, ...page.data],
            };
          }
          return page;
        });

        return { ...oldData, pages: newPages };
      },
    );

    setInput("");
    setReplyingTo(null);

    send({
      type: "message:send",
      data: {
        chatId: id,
        content: messageContent,
        tempId,
        replyToId: replyId,
      },
    });

    const failTimer = setTimeout(() => {
      queryClient.setQueryData<InfiniteData<{ data: Message[] }>>(
        ["messages", id],
        (oldData) => {
          if (!oldData) return oldData;
          const newPages = oldData.pages.map((page) => {
            return {
              ...page,
              data: page.data.map((message) => {
                if (message.id === tempId && message._status === "SENDING") {
                  return {
                    ...message,
                    _status: "FAILED" as const,
                  };
                }
                return message;
              }),
            };
          });

          return { ...oldData, pages: newPages };
        },
      );
      pendingMessagesRef.current.delete(tempId);
    }, 10000);

    pendingMessagesRef.current.set(tempId, failTimer);
  }, [input, currentUser?.id, replyingTo?.id, id, send]);

  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const retryMessage = useCallback(
    (failedMessage: Message) => {
      if (!failedMessage._tempId) return;

      queryClient.setQueryData<InfiniteData<{ data: Message[] }>>(
        ["messages", id],
        (oldData) => {
          if (!oldData) return oldData;
          const newPages = oldData.pages.map((page) => {
            return {
              ...page,
              data: page.data.map((message) => {
                if (message._tempId === failedMessage._tempId) {
                  return {
                    ...message,
                    _status: "SENDING" as const,
                  };
                }
                return message;
              }),
            };
          });
          return { ...oldData, pages: newPages };
        },
      );

      send({
        type: "message:send",
        data: {
          chatId: id,
          content: failedMessage.content,
          tempId: failedMessage._tempId,
          replyToId: failedMessage.replyToId,
        },
      });

      const failTimer = setTimeout(() => {
        queryClient.setQueryData<InfiniteData<{ data: Message[] }>>(
          ["messages", id],
          (oldData) => {
            if (!oldData) return oldData;
            const newPages = oldData.pages.map((page) => {
              return {
                ...page,
                data: page.data.map((message) => {
                  if (
                    message._tempId === failedMessage._tempId &&
                    message._status === "SENDING"
                  ) {
                    return {
                      ...message,
                      _status: "FAILED" as const,
                    };
                  }
                  return message;
                }),
              };
            });
            return { ...oldData, pages: newPages };
          },
        );
        pendingMessagesRef.current.delete(failedMessage._tempId!);
      }, 10000);

      pendingMessagesRef.current.set(failedMessage._tempId!, failTimer);
    },
    [id, send],
  );

  const handleReply = useCallback((message: Message) => {
    setReplyingTo(message);
    setEmojiVisible(false);
  }, []);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const sendTyping = useCallback(() => {
    if (!id || !currentUser?.id) return;

    send({
      type: "typing",
      data: {
        chatId: id,
      },
    });
  }, [id, currentUser?.id, send]);

  const onInputChange = useCallback(
    (text: string) => {
      setInput(text);

      if (typingTimeout.current) clearTimeout(typingTimeout.current);

      sendTyping();

      typingTimeout.current = setTimeout(() => {
        typingTimeout.current = null;
      }, 3000);
    },
    [sendTyping],
  );

  useEffect(() => {
    const currentPendingMessages = pendingMessagesRef.current;

    return () => {
      currentPendingMessages.forEach((timer) => clearTimeout(timer));
    };
  }, [pendingMessagesRef]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      "keyboardDidShow",
      (_e: KeyboardEvent) => {
        setTimeout(() => {
          if (isAtBottomRef.current) {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }
        }, 50);
      },
    );
    return () => {
      showSubscription.remove();
    };
  }, []);

  const backAction = useCallback(() => {
    if (emojiVisible) {
      setEmojiVisible(false);
    }
    if (replyingTo) {
      setReplyingTo(null);
    } else {
      router.back();
    }
    return true;
  }, [replyingTo, emojiVisible]);

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction,
      );

      return () => {
        backHandler.remove();
      };
    }, [backAction]),
  );

  useFocusEffect(
    useCallback(() => {
      useNavigationStore.getState().setCurrentChatId(id);

      return () => {
        useNavigationStore.getState().setCurrentChatId(null);
      };
    }, [id]),
  );

  useReadReceiptsWithAppState(allMessages, id);

  const findReplyMessage = useCallback(
    (replyToId: string | undefined): Message | null => {
      if (!replyToId) return null;

      const messageWithReply = allMessages.find(
        (msg) => msg.replyTo?.id === replyToId,
      );
      if (messageWithReply?.replyTo) {
        return messageWithReply.replyTo as Message;
      }

      return allMessages.find((msg) => msg.id === replyToId) || null;
    },
    [allMessages],
  );

  const { data: otherUserProfile } = useGetUserProfile(otherUserId);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const [searchingForMessage, setSearchingForMessage] = useState<string | null>(
    null,
  );

  const scrollToMessage = useCallback(
    async (messageId: string) => {
      if (searchingForMessage) return;

      const currentMessageCount = allMessages.length;
      const messageIndex = allMessages.findIndex((msg) => msg.id === messageId);

      if (messageIndex !== -1) {
        if (messageIndex >= 0 && messageIndex < currentMessageCount) {
          setHighlightedMessageId(messageId);

          try {
            flatListRef.current?.scrollToIndex({
              index: messageIndex,
              animated: true,
            });
          } catch {
            const estimatedOffset = messageIndex * ESTIMATED_ITEM_HEIGHT;
            flatListRef.current?.scrollToOffset({
              offset: Math.max(0, estimatedOffset),
              animated: true,
            });
          }

          setTimeout(() => {
            setHighlightedMessageId(null);
          }, 2000);

          return;
        }
      }

      setSearchingForMessage(messageId);

      let attempts = 0;
      const maxAttempts = 15;

      const searchForMessage = async (): Promise<boolean> => {
        if (attempts >= maxAttempts) {
          return false;
        }

        attempts++;

        if (!hasNextPage || isFetchingNextPage) {
          if (isFetchingNextPage) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            return await searchForMessage();
          } else {
            return false;
          }
        }

        try {
          await fetchNextPage();
          await new Promise((resolve) => setTimeout(resolve, 200));

          const updatedMessages = queryClient.getQueryData<
            InfiniteData<{ data: Message[] }>
          >(["messages", id]);

          const updatedAllMessages =
            updatedMessages?.pages.flatMap((page) => page.data) ?? [];
          const foundIndex = updatedAllMessages.findIndex(
            (msg) => msg.id === messageId,
          );

          if (foundIndex !== -1 && foundIndex < updatedAllMessages.length) {
            setHighlightedMessageId(messageId);

            setTimeout(() => {
              try {
                flatListRef.current?.scrollToIndex({
                  index: foundIndex,
                  animated: true,
                  viewPosition: 0.9,
                });
              } catch {
                const estimatedOffset = foundIndex * ESTIMATED_ITEM_HEIGHT;
                flatListRef.current?.scrollToOffset({
                  offset: Math.max(0, estimatedOffset),
                  animated: true,
                });
              }
            }, 300);

            setTimeout(() => {
              setHighlightedMessageId(null);
            }, 2500);

            return true;
          }

          return await searchForMessage();
        } catch {
          return false;
        }
      };

      try {
        await searchForMessage();
      } finally {
        setSearchingForMessage(null);
      }
    },
    [
      allMessages,
      hasNextPage,
      fetchNextPage,
      isFetchingNextPage,
      id,
      searchingForMessage,
    ],
  );

  const handleScrollToIndexFailed = useCallback(
    (info: {
      index: number;
      highestMeasuredFrameIndex: number;
      averageItemLength: number;
    }) => {
      const wait = new Promise((resolve) => setTimeout(resolve, 500));
      wait.then(() => {
        const safeIndex = Math.min(
          info.index,
          Math.max(0, info.highestMeasuredFrameIndex),
          allMessages.length - 1,
        );

        if (safeIndex >= 0 && safeIndex < allMessages.length) {
          try {
            flatListRef.current?.scrollToIndex({
              index: safeIndex,
              animated: true,
              viewPosition: 0.5,
            });
          } catch {
            const itemHeight = info.averageItemLength || ESTIMATED_ITEM_HEIGHT;
            const estimatedOffset = safeIndex * itemHeight;
            flatListRef.current?.scrollToOffset({
              offset: Math.max(0, estimatedOffset),
              animated: true,
            });
          }
        }
      });
    },
    [allMessages.length],
  );

  const handleScroll = useCallback((e: any) => {
    const { contentOffset } = e.nativeEvent;
    const isAtBottom = contentOffset.y <= SCROLL_THRESHOLD;
    isAtBottomRef.current = isAtBottom;
  }, []);

  const handleContentSizeChange = useCallback(() => {
    if (isAtBottomRef.current) {
      flatListRef.current?.scrollToOffset({
        offset: 0,
        animated: true,
      });
    }
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const { showActionSheetWithOptions } = useActionSheet();

  const handleLongPressMessage = useCallback(
    (messageId: string) => {
      const options = [LL.DELETE(), LL.DELETE_FOR_EVERYONE(), LL.CANCEL()];
      const cancelButtonIndex = 2;

      showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          showSeparators: true,
          title: LL.MESSAGE_OPTIONS(),
          containerStyle: { backgroundColor: theme.colors.background },
          titleTextStyle: { color: theme.colors.onBackground },
          tintColor: theme.colors.primary,
          icons: [
            <Ionicons name="trash" size={24} color={theme.colors.error} />,
            <Ionicons name="trash" size={24} color={theme.colors.error} />,
            null,
          ],
        },
        (selectedIndex) => {
          switch (selectedIndex) {
            case 0:
              send({
                type: "message:delete",
                data: { chatId: id, messageId },
              });
              break;
            case 1:
              send({
                type: "message:delete",
                data: { chatId: id, messageId, deleteForBoth: true },
              });
              break;
          }
        },
      );
    },
    [showActionSheetWithOptions, send, id, theme, LL],
  );

  const renderItem = useCallback(
    ({ item }: { item: Message }) => (
      <SwipeableMessage
        item={item}
        onLongPressMessage={handleLongPressMessage}
        retryMessage={retryMessage}
        onReply={handleReply}
        replyToMessage={findReplyMessage(item.replyToId)}
        otherUserName={
          otherUserProfile?.firstName + " " + otherUserProfile?.lastName
        }
        onGoToMessage={scrollToMessage}
        isHighlighted={highlightedMessageId === item.id}
      />
    ),
    [
      retryMessage,
      handleReply,
      findReplyMessage,
      otherUserProfile?.firstName,
      otherUserProfile?.lastName,
      scrollToMessage,
      highlightedMessageId,
      handleLongPressMessage,
    ],
  );

  const handleDelete = () => {
    setInput((prev) => {
      const graphemes = splitter.splitGraphemes(prev);
      if (graphemes.length > 0) {
        graphemes.pop();
        return graphemes.join("");
      }
      return prev;
    });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {isError && !isFetching ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <KeyboardGestureArea interpolator="ios" style={{ flex: 1 }}>
          <Tabs.Screen
            options={{
              title: LL.CHAT(),
              headerLeft: () => (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={backAction}
                >
                  <Ionicons
                    name="arrow-back"
                    size={18}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
              ),
              href: null,
            }}
          />

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={"padding"}
            keyboardVerticalOffset={85}
          >
            <Animated.FlatList
              ref={flatListRef}
              inverted
              ListHeaderComponent={() =>
                isFetchingNextPage && hasNextPage ? (
                  <LoadingMoreIndicator />
                ) : null
              }
              refreshing={isFetching && !isFetchingNextPage}
              onRefresh={refetch}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onContentSizeChange={handleContentSizeChange}
              onEndReached={handleEndReached}
              onScrollToIndexFailed={handleScrollToIndexFailed}
              data={allMessages}
              itemLayoutAnimation={LinearTransition}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              contentContainerStyle={styles.messagesContainer}
              onEndReachedThreshold={END_REACHED_THRESHOLD}
              maxToRenderPerBatch={BATCH_SIZE}
              windowSize={WINDOW_SIZE}
              removeClippedSubviews
              initialNumToRender={INITIAL_NUM_TO_RENDER}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 100,
              }}
              updateCellsBatchingPeriod={50}
            />
            {isFetching && !isFetchingNextPage && !isLoading && (
              <View style={styles.refetchOverlay}>
                <ActivityIndicator size="small" />
              </View>
            )}

            <View style={{ marginStart: 16 }}>
              <TypingIndicator chatId={id} />
            </View>

            <MessageSearchIndicator
              isVisible={Boolean(searchingForMessage)}
              theme={theme}
            />

            <ReplyPreview
              replyingTo={replyingTo}
              theme={theme}
              currentUser={currentUser}
              otherUserProfile={otherUserProfile}
              onCancel={cancelReply}
            />

            <View
              style={[
                styles.inputContainer,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <TextInput
                ref={messageInputRef}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.onSecondaryContainer,
                    color: theme.colors.inverseOnSurface,
                  },
                ]}
                value={input}
                onChangeText={onInputChange}
                placeholder={
                  replyingTo ? LL.REPLY_TO_MESSAGE() : LL.TYPE_A_MESSAGE()
                }
                placeholderTextColor={theme.colors.inverseOnSurface}
                multiline
                maxLength={2000}
              />

              <TouchableOpacity
                style={styles.emojiButton}
                onPress={() => {
                  if (!emojiVisible) setEmojiVisible(true);
                  else if (!Keyboard.isVisible())
                    messageInputRef.current?.focus();
                  else Keyboard.dismiss();
                }}
              >
                {!emojiVisible ? (
                  <Ionicons
                    name="happy"
                    size={24}
                    color={theme.colors.primary}
                  />
                ) : (
                  <FontAwesome5
                    name="keyboard"
                    size={24}
                    color={theme.colors.primary}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={sendMessageFN}
                style={[
                  styles.sendButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                disabled={!input.trim()}
              >
                <Text style={{ color: theme.colors.onPrimary }}>
                  {LL.SEND()}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>

          {emojiVisible ? (
            <Animated.View
              style={styles.emojiContainer}
              entering={SlideInDown}
              exiting={SlideOutDown}
            >
              <EmojiKeyboard
                emojiViewStyle={{
                  flex: 1,
                  backgroundColor: theme.colors.secondaryContainer,
                }}
                onEmojiSelected={(emoji) =>
                  setInput((prevInput) => prevInput + emoji)
                }
              >
                <View style={styles.emojiDeleteContainer}>
                  <Pressable
                    onPress={handleDelete}
                    onLongPress={() => {
                      handleDelete();

                      deleteInterval.current = setInterval(handleDelete, 100);
                    }}
                    onPressOut={() => {
                      if (deleteInterval.current) {
                        clearInterval(
                          deleteInterval.current as unknown as number,
                        );
                        deleteInterval.current = null;
                      }
                    }}
                    delayLongPress={200}
                  >
                    <FontAwesome6
                      name="delete-left"
                      size={24}
                      color={theme.colors.primary}
                    />
                  </Pressable>
                </View>
              </EmojiKeyboard>
            </Animated.View>
          ) : null}
        </KeyboardGestureArea>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  messagesContainer: {
    padding: 10,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    margin: 10,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: "center",
  },
  emojiButton: {
    marginStart: 8,
    justifyContent: "center",
    paddingVertical: 10,
  },
  emojiContainer: {
    height: 320,
  },
  emojiDeleteContainer: {
    alignSelf: "flex-end",
    marginHorizontal: 16,
  },
  replyPreview: {
    marginHorizontal: 10,
    marginBottom: 5,
    padding: 12,
    borderRadius: 8,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  replyContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  replyBar: {
    width: 3,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  replyText: {
    flex: 1,
  },
  replyUsername: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  replyMessage: {
    fontSize: 14,
    opacity: 0.8,
  },
  cancelReplyButton: {
    padding: 8,
    marginLeft: 12,
  },
  searchIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    marginHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 8,
    marginBottom: 8,
  },
  searchText: {
    marginLeft: 8,
    fontSize: 12,
  },
  skeletonContainer: {
    flex: 1,
    padding: 16,
  },
  skeletonMessage: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 12,
    opacity: 0.6,
  },
  skeletonLeft: {
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  skeletonRight: {
    alignSelf: "flex-end",
    maxWidth: "80%",
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginVertical: 2,
  },
  skeletonLineShort: {
    width: "60%",
  },
  skeletonLineLong: {
    width: "90%",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorCard: {
    width: "100%",
    maxWidth: 300,
  },
  errorContent: {
    alignItems: "center",
  },
  errorTitle: {
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    marginBottom: 16,
    textAlign: "center",
    opacity: 0.7,
  },
  retryButton: {
    marginTop: 8,
  },
  loadingMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    opacity: 0.7,
  },
  refetchOverlay: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 20,
    padding: 8,
  },
});
