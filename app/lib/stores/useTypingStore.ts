import { create } from "zustand";

type TypingUsersByChat = Record<string, Set<string>>;

type TimeoutMap = Record<string, NodeJS.Timeout>;

interface TypingStore {
  typingUsersByChat: TypingUsersByChat;
  typingTimeouts: TimeoutMap;
  userTyping: (chatId: string, userId: string) => void;
  removeUserTyping: (chatId: string, userId: string) => void;
}

export const useTypingStore = create<TypingStore>((set, get) => ({
  typingUsersByChat: {},
  typingTimeouts: {},

  userTyping: (chatId, userId) => {
    const typingUsersByChat = { ...get().typingUsersByChat };
    if (!typingUsersByChat[chatId]) typingUsersByChat[chatId] = new Set();

    typingUsersByChat[chatId].add(userId);

    set({ typingUsersByChat });

    const timeoutKey = `${chatId}-${userId}`;
    const prevTimeout = get().typingTimeouts[timeoutKey];
    if (prevTimeout) clearTimeout(prevTimeout);

    const newTimeout = setTimeout(() => {
      get().removeUserTyping(chatId, userId);
    }, 3000);

    set((state) => ({
      typingTimeouts: {
        ...state.typingTimeouts,
        [timeoutKey]: newTimeout,
      },
    }));
  },

  removeUserTyping: (chatId, userId) => {
    const typingUsersByChat = { ...get().typingUsersByChat };
    if (typingUsersByChat[chatId]) {
      typingUsersByChat[chatId].delete(userId);
      if (typingUsersByChat[chatId].size === 0) {
        delete typingUsersByChat[chatId];
      }
    }

    const timeoutKey = `${chatId}-${userId}`;
    const typingTimeouts = { ...get().typingTimeouts };
    if (typingTimeouts[timeoutKey]) {
      clearTimeout(typingTimeouts[timeoutKey]);
      delete typingTimeouts[timeoutKey];
    }

    set({ typingUsersByChat, typingTimeouts });
  },
}));
