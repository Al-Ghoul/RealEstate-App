import { create } from "zustand";
import * as Network from "expo-network";
import { queryClient } from "../client";
import type { InfiniteData } from "@tanstack/react-query";
import { useTypingStore } from "./useTypingStore";
import { router } from "expo-router";
import { toast } from "sonner-native";
import { useNavigationStore } from "./navigationStore";
import { xiorInstance } from "../fetcher";

export type ClientMessage =
  | {
      type: "message:send";
      data: {
        tempId: string;
        chatId: string;
        content: string;
        replyToId?: string;
      };
    }
  | {
      type: "typing";
      data: {
        chatId: string;
      };
    }
  | {
      type: "message:read";
      data: {
        chatId: string;
        messageId: string;
      };
    }
  | {
      type: "chat:delete";
      data: {
        chatId: string;
        deleteForBoth?: boolean;
      };
    }
  | {
      type: "message:delete";
      data: {
        chatId: string;
        messageId: string;
        deleteForBoth?: boolean;
      };
    };

// Server-to-client messages (what client receives)
export type ServerMessage =
  | {
      type: "message:new";
      data: {
        _tempId: string;
        chatId: string;
        senderId: string;
        senderFullName: string;
        recipentFullName: string;
        content: string;
        createdAt: string;
        serverId: string;
        replyToId?: string;
        replyTo?: {
          id: string;
          senderId: string;
          content: string;
          createdAt: Date;
        };
      };
    }
  | {
      type: "typing";
      data: {
        chatId: string;
        userId: string;
      };
    }
  | {
      type: "message:read";
      data: {
        chatId: string;
        userId: string;
        messageId: string;
      };
    }
  | { type: "message:failed"; data: { _tempId: string; chatId: string } }
  | {
      type: "chat:deleted";
      data: {
        chatId: string;
        deletedBy: string;
        deletedForBoth: boolean;
      };
    }
  | {
      type: "message:deleted";
      data: {
        chatId: string;
        messageId: string;
      };
    };

const handleIncomingMessage = async (message: ServerMessage) => {
  const currentUser = await queryClient.ensureQueryData<User>({
    queryKey: ["current-user"],
    queryFn: () => xiorInstance.get("/users/me").then((res) => res.data.data),
  });

  const currentUserId = currentUser?.id;

  if (!currentUserId) return;

  switch (message.type) {
    case "message:new": {
      const {
        _tempId,
        chatId,
        senderId,
        senderFullName,
        recipentFullName,
        content,
        createdAt,
        serverId,
        replyToId,
        replyTo,
      } = message.data;

      queryClient.setQueryData<InfiniteData<{ data: Message[] }>>(
        ["messages", chatId],
        (oldData) => {
          if (!oldData) return oldData;

          const newPages = oldData.pages.map((page, index) => {
            if (index === 0) {
              const messages = [...page.data];
              const tempIndex = messages.findIndex(
                (msg) => msg._tempId === _tempId,
              );

              if (tempIndex !== -1) {
                messages[tempIndex] = {
                  id: serverId,
                  chatId,
                  senderId,
                  content,
                  createdAt,
                  _status: "SENT",
                  replyToId,
                  replyTo,
                };

                return { ...page, data: messages };
              }

              return {
                ...page,
                data: [
                  {
                    id: serverId,
                    chatId,
                    senderId,
                    content,
                    createdAt,
                    _status: "SENT" as const,
                    replyToId,
                    replyTo,
                  },
                  ...messages,
                ],
              };
            }

            return page;
          });

          return { ...oldData, pages: newPages };
        },
      );

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

              let updatedChats;

              if (existingChatIndex !== -1) {
                const existingChat = chats[existingChatIndex];
                const updatedChat = {
                  ...existingChat,
                  lastMessageContent: content,
                  lastMessageCreatedAt: createdAt,
                  lastMessageSenderId: senderId,
                  lastMessageId: serverId,
                  unreadCount:
                    senderId === currentUserId
                      ? existingChat.unreadCount
                      : existingChat.unreadCount + 1,
                  otherUserFullName:
                    senderId === currentUserId
                      ? recipentFullName
                      : senderFullName,
                };

                chats.splice(existingChatIndex, 1);
                updatedChats = [updatedChat, ...chats];
              } else {
                const [otherUserId] = chatId
                  .split("_")
                  .filter((id) => id !== currentUserId);
                const newChat = {
                  chatId,
                  lastMessageContent: content,
                  lastMessageCreatedAt: createdAt,
                  lastMessageSenderId: senderId,
                  lastMessageId: serverId,
                  unreadCount: senderId === currentUserId ? 0 : 1,
                  otherUserId:
                    senderId === currentUserId ? otherUserId : senderId,
                  otherUserFullName: senderFullName,
                  replyTo,
                };
                updatedChats = [newChat, ...chats];
              }

              updatedChats.sort((a, b) => {
                const timeA = new Date(a.lastMessageCreatedAt).getTime();
                const timeB = new Date(b.lastMessageCreatedAt).getTime();
                return timeB - timeA;
              });

              return { ...page, data: updatedChats };
            }
            return page;
          });
          return { ...oldData, pages: newPages };
        },
      );

      break;
    }

    case "message:failed": {
      const { _tempId, chatId } = message.data;

      queryClient.setQueryData<InfiniteData<{ data: Message[] }>>(
        ["messages", chatId],
        (oldData) => {
          if (!oldData) return oldData;

          const newPages = oldData.pages.map((page) => {
            const messages = [...page.data];
            const tempIndex = messages.findIndex(
              (msg) => msg._tempId === _tempId,
            );

            if (tempIndex !== -1) {
              messages[tempIndex] = {
                ...messages[tempIndex],
                _status: "FAILED",
              };
              return { ...page, data: messages };
            }

            return page;
          });

          return { ...oldData, pages: newPages };
        },
      );

      break;
    }

    case "chat:deleted": {
      const { chatId, deletedBy, deletedForBoth } = message.data;

      queryClient.setQueryData<InfiniteData<{ data: Chat[] }>>(
        ["chats"],
        (oldData) => {
          if (!oldData) return oldData;

          const newPages = oldData.pages.map((page) => {
            const filteredChats = page.data.filter(
              (chat) => chat.chatId !== chatId,
            );
            return { ...page, data: filteredChats };
          });

          return { ...oldData, pages: newPages };
        },
      );

      queryClient.removeQueries({
        queryKey: ["messages", chatId],
        type: "all",
      });

      const currentChatId = useNavigationStore.getState().currentChatId;

      if (currentChatId === chatId) {
        if (deletedForBoth) {
          toast(
            deletedBy === currentUserId
              ? "You deleted this chat for everyone"
              : "This chat was deleted by the other user",
          );
        } else {
          toast("Chat has been removed from your list");
        }

        router.back();
        useNavigationStore.getState().setCurrentChatId(null);
      }

      break;
    }
    case "typing": {
      const { chatId, userId } = message.data;
      useTypingStore.getState().userTyping(chatId, userId);
      break;
    }

    case "message:deleted": {
      const { chatId, messageId } = message.data;

      queryClient.setQueryData<InfiniteData<{ data: Message[] }>>(
        ["messages", chatId],
        (oldData) => {
          if (!oldData) return oldData;

          const newPages = oldData.pages.map((page) => ({
            ...page,
            data: page.data.filter((msg) => msg.id !== messageId),
          }));

          return { ...oldData, pages: newPages };
        },
      );

      const updated = queryClient.getQueryData<
        InfiniteData<{ data: Message[] }>
      >(["messages", chatId]);

      const isEmpty = !updated?.pages.some((page) => page.data.length > 0);

      if (isEmpty) {
        queryClient.setQueryData<InfiniteData<{ data: Chat[] }>>(
          ["chats"],
          (oldChats) => {
            if (!oldChats) return oldChats;

            const newPages = oldChats.pages.map((page) => ({
              ...page,
              data: page.data.filter((chat) => chat.chatId !== chatId),
            }));

            return { ...oldChats, pages: newPages };
          },
        );

        queryClient.removeQueries({
          queryKey: ["messages", chatId],
          type: "all",
        });
      }

      break;
    }
  }
};

interface WebSocketState {
  socket: WebSocket | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectInterval: number;
  url: string | null;
  messageQueue: string[];
  isNetworkAvailable: boolean;
  connect: (url: string | null) => Promise<void>;
  disconnect: () => void;
  sendMessage: (message: string) => void;
  initializeConnection: () => Promise<void>;
  addToQueue: (message: string) => void;
  flushQueue: () => void;
  clearQueue: () => void;
  checkNetworkAndReconnect: () => Promise<void>;
  send: (message: ClientMessage) => void;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectInterval: 3000,
  url: null,
  messageQueue: [],
  isNetworkAvailable: false,
  messageHandlers: [],

  send: (message: ClientMessage) => {
    const { socket } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      get().addToQueue(JSON.stringify(message));
    }
  },

  initializeConnection: async () => {
    const {
      url,
      reconnectAttempts,
      maxReconnectAttempts,
      reconnectInterval,
      isNetworkAvailable,
    } = get();

    if (reconnectAttempts >= maxReconnectAttempts) return;

    if (!url || !isNetworkAvailable) return;

    const ws = new WebSocket(url);

    ws.onopen = () => {
      set({
        socket: ws,
        reconnectAttempts: 0,
      });
      get().flushQueue();
    };

    ws.onclose = (event) => {
      set({
        socket: null,
      });

      if (event.code !== 1000 && event.code !== 1008 && url) {
        const { reconnectAttempts, maxReconnectAttempts, isNetworkAvailable } =
          get();
        if (reconnectAttempts < maxReconnectAttempts && isNetworkAvailable) {
          const delay = Math.min(
            30000,
            reconnectInterval * Math.pow(2, reconnectAttempts),
          );

          setTimeout(() => {
            set((state) => ({
              reconnectAttempts: state.reconnectAttempts + 1,
            }));
            get().initializeConnection();
          }, delay);
        }
      }
    };

    ws.onerror = (ev) => console.error(ev);

    ws.onmessage = (event) => {
      try {
        const message: ServerMessage = JSON.parse(event.data);
        handleIncomingMessage(message);
      } catch (error) {
        console.error("Error processing message:", error);
      }
    };

    set({ socket: ws });
  },

  connect: async (url: string | null) => {
    const { socket, url: currentUrl } = get();

    if (
      socket?.readyState === WebSocket.OPEN ||
      socket?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    if (currentUrl === url && socket && socket.readyState !== WebSocket.CLOSED)
      socket.close();

    set({ url });
    await get().checkNetworkAndReconnect();
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close(1000, "User initiated disconnect");
    }
    set({
      socket: null,
      reconnectAttempts: 0,
    });
  },

  sendMessage: (message: string) => {
    const { socket, isNetworkAvailable } = get();
    if (socket?.readyState === WebSocket.OPEN && isNetworkAvailable) {
      try {
        socket.send(message);
      } catch (error) {
        console.error("Error sending message:", error);
        get().addToQueue(message);
      }
    } else {
      get().addToQueue(message);
      if (!isNetworkAvailable && !socket) {
        get().checkNetworkAndReconnect();
      }
    }
  },

  addToQueue: (message: string) => {
    set((state) => {
      const queue = [...state.messageQueue, message];
      return {
        messageQueue: queue.slice(-100),
      };
    });
  },

  flushQueue: () => {
    const { messageQueue, socket, isNetworkAvailable } = get();
    if (socket && isNetworkAvailable) {
      try {
        messageQueue.forEach((msg) => {
          socket.send(msg);
        });
        set({ messageQueue: [] });
      } catch (error) {
        console.error("Error flushing queue:", error);
      }
    }
  },

  clearQueue: () => {
    set({ messageQueue: [] });
  },

  checkNetworkAndReconnect: async () => {
    const networkState = await Network.getNetworkStateAsync();
    const isNowAvailable =
      networkState.isConnected && networkState.isInternetReachable !== false;

    set({ isNetworkAvailable: isNowAvailable });

    if (isNowAvailable) {
      const { socket, url } = get();
      const isSocketAlive =
        socket?.readyState === WebSocket.OPEN ||
        socket?.readyState === WebSocket.CONNECTING;

      if (!isSocketAlive && url) {
        get().initializeConnection();
      } else {
        get().flushQueue();
      }
    }
  },
}));
