import { xiorInstance } from "@/lib/fetcher";
import { useIsFocused } from "@react-navigation/native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import {
  useTheme,
  Text,
  Portal,
  Dialog,
  Button,
  Checkbox,
  Banner,
} from "react-native-paper";
import Reanimated, { SequencedTransition } from "react-native-reanimated";
import WaveDecoratedView from "@/components/WaveDecoratedView";
import ChatItem from "@/components/ChatItem";
import { useState, useCallback } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ChatItemSkeleton from "@/components/chat/Skeleton";
import { useWebSocketStore } from "@/lib/stores/useWebSocketStore";
import { useI18nContext } from "@/i18n/i18n-react";

export default function ChatScreen() {
  const theme = useTheme();
  const { LL, locale } = useI18nContext();
  const forceRTL = locale === "ar";
  const isFocused = useIsFocused();
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

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
    queryKey: ["chats"],
    queryFn: async (input) => {
      let params: {
        limit: number;
        cursor?: string;
        cursorCreatedAt?: string;
      } = {
        limit: 10,
        cursor: input.pageParam.cursor,
        cursorCreatedAt: input.pageParam.cursorCreatedAt,
      };

      const res = await xiorInstance.get("/chats", {
        params,
      });

      return res.data;
    },
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
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

  const handleLongPress = useCallback((chatId: string) => {
    setIsSelectionMode(true);
    setSelectedChats(new Set([chatId]));
  }, []);

  const handleSelect = useCallback((chatId: string) => {
    setSelectedChats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chatId)) {
        newSet.delete(chatId);
      } else {
        newSet.add(chatId);
      }

      if (newSet.size === 0) {
        setIsSelectionMode(false);
      }

      return newSet;
    });
  }, []);

  const handleDeselectAll = useCallback(() => {
    setSelectedChats(new Set());
    setIsSelectionMode(false);
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    setSelectedChats(new Set());
    setIsSelectionMode(false);
    refetch();
  }, [refetch]);

  const [isDeletionDialogVisible, setDeletionDialogVisible] = useState<{
    visible: boolean;
    chatId: Chat["chatId"] | null;
  }>({ visible: false, chatId: null });
  const [isBothDeletionChecked, setIsBothDeletionChecked] = useState(false);
  const { send } = useWebSocketStore();

  return (
    <>
      <Tabs.Screen
        options={{
          headerTitle: () =>
            isSelectionMode ? (
              <SelectionHeader
                selectedChats={selectedChats}
                handleDeleteSelected={handleDeleteSelected}
                handleDeselectAll={handleDeselectAll}
              />
            ) : (
              <NormalHeader />
            ),
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerShadowVisible: true,
        }}
      />

      <WaveDecoratedView
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
        }}
      >
        <Banner
          visible={isError && !isFetching}
          style={{
            backgroundColor: theme.colors.errorContainer,
          }}
          theme={{
            colors: {
              primary: theme.colors.onErrorContainer,
            },
          }}
          actions={[
            {
              label: LL.RETRY(),
              onPress: () => refetch(),
            },
          ]}
        >
          <Text
            style={{
              color: theme.colors.onErrorContainer,
              textAlign: forceRTL ? "right" : "left",
            }}
          >
            {LL.ERROR_FETCHING_CHAT_DATA()}
          </Text>
        </Banner>
        <Portal>
          <Dialog
            visible={isDeletionDialogVisible.visible}
            onDismiss={() =>
              setDeletionDialogVisible((prev) => ({ ...prev, visible: false }))
            }
          >
            <Dialog.Title>{LL.DELETE_CHAT_PROMPT()}</Dialog.Title>
            <Dialog.Content>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text>{LL.DELETE_FOR_EVERYONE()}</Text>
                <Checkbox
                  status={isBothDeletionChecked ? "checked" : "unchecked"}
                  onPress={() => {
                    setIsBothDeletionChecked(!isBothDeletionChecked);
                  }}
                />
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => {
                  send({
                    type: "chat:delete",
                    data: {
                      chatId: isDeletionDialogVisible.chatId!,
                      deleteForBoth: isBothDeletionChecked,
                    },
                  });
                  setDeletionDialogVisible({ visible: false, chatId: null });
                  setIsBothDeletionChecked(false);
                }}
              >
                {LL.DELETE()}
              </Button>
              <Button
                onPress={() => {
                  setDeletionDialogVisible({ visible: false, chatId: null });
                  setIsBothDeletionChecked(false);
                }}
              >
                {LL.CANCEL()}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
        {isLoading ? (
          Array(15)
            .fill(null)
            .map((_, index) => <ChatItemSkeleton key={index} isLoading />)
        ) : (
          <Reanimated.FlatList
            itemLayoutAnimation={SequencedTransition}
            data={data?.pages.flatMap((page) => page)}
            keyExtractor={(item) => item.chatId}
            renderItem={({ item }) => (
              <ChatItem
                item={item}
                key={item.chatId}
                isSelectionMode={isSelectionMode}
                isSelected={selectedChats.has(item.chatId)}
                onLongPress={handleLongPress}
                onSelect={handleSelect}
                setIsDeletionDialogVisible={setDeletionDialogVisible}
              />
            )}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            refreshing={isFetching || isFetchingNextPage}
            onRefresh={() => refetch()}
          />
        )}
      </WaveDecoratedView>
    </>
  );
}

const NormalHeader = () => {
  const theme = useTheme();
  const { LL } = useI18nContext();
  return (
    <Text variant="headlineSmall" style={{ color: theme.colors.onSurface }}>
      {LL.CHAT()}
    </Text>
  );
};

const SelectionHeader = ({
  handleDeselectAll,
  handleDeleteSelected,
  selectedChats,
}: {
  handleDeselectAll: () => void;
  handleDeleteSelected: () => void;
  selectedChats: Set<string>;
}) => {
  const theme = useTheme();
  return (
    <View style={styles.selectionHeaderContainer}>
      <TouchableOpacity
        style={[styles.headerButton, { backgroundColor: theme.colors.surface }]}
        onPress={handleDeselectAll}
      >
        <Ionicons name="close" size={20} color={theme.colors.onSurface} />
      </TouchableOpacity>

      <Text
        variant="headlineSmall"
        style={[styles.selectionTitle, { color: theme.colors.onSurface }]}
      >
        {selectedChats.size} selected
      </Text>

      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[
            styles.headerButton,
            { backgroundColor: theme.colors.surface },
          ]}
          onPress={handleDeleteSelected}
          disabled={selectedChats.size === 0}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color={
              selectedChats.size === 0
                ? theme.colors.outline
                : theme.colors.error
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  selectionHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 16,
  },
  selectionTitle: {
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
});
