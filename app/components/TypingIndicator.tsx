import { queryClient } from "@/lib/client";
import { useCurrentUser } from "@/lib/queries/user";
import { useTypingStore } from "@/lib/stores/useTypingStore";
import { useWebSocketStore } from "@/lib/stores/useWebSocketStore";
import type { InfiniteData } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { AppState, View } from "react-native";
import { Text } from "react-native-paper";

export default function TypingIndicator({ chatId }: { chatId: string }) {
  const typingCount = useTypingStore(
    (state) => state.typingUsersByChat[chatId]?.size ?? 0,
  );

  if (typingCount === 0) return null;

  return (
    <View style={{ paddingVertical: 4 }}>
      <Text style={{ fontStyle: "italic", color: "#888" }}>Typing...</Text>
    </View>
  );
}

export function useReadReceiptsWithAppState(
  messages: Message[],
  chatId: string,
) {
  const { send } = useWebSocketStore();
  const { data: currentUser } = useCurrentUser();
  const [appState, setAppState] = useState(AppState.currentState);
  const lastSentMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      setAppState(nextAppState);
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    if (!currentUser?.id || messages.length === 0 || appState !== "active")
      return;

    let lastOtherUserMessage = null;
    for (const message of messages) {
      if (message.senderId !== currentUser.id) {
        lastOtherUserMessage = message;
        break;
      }
    }

    if (!lastOtherUserMessage) return;
    if (lastSentMessageIdRef.current === lastOtherUserMessage.id) return;

    send({
      type: "message:read",
      data: {
        chatId,
        messageId: lastOtherUserMessage.id,
      },
    });

    queryClient.setQueryData<InfiniteData<{ data: Chat[] }>>(
      ["chats"],
      (oldData) => {
        if (!oldData) return oldData;
        const newPages = oldData.pages.map((page, index) => {
          if (index === 0) {
            const chats = [...page.data];
            const existingChatIndex = chats.findIndex(
              (chat) => chat.chatId === chatId,
            );
            const existingChat = chats[existingChatIndex];
            const updatedChat = {
              ...existingChat,
              unreadCount: 0,
            };
            chats.splice(existingChatIndex, 1);
            const updatedChats = [updatedChat, ...chats];
            return { ...page, data: updatedChats };
          }
          return page;
        });
        return { ...oldData, pages: newPages };
      },
    );

    lastSentMessageIdRef.current = lastOtherUserMessage.id;
  }, [chatId, messages, currentUser?.id, send, appState]);
}
