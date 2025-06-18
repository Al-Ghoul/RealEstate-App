import { create } from "zustand";
export const useNavigationStore = create<{
  currentChatId: string | null;
  setCurrentChatId: (chatId: string | null) => void;
}>((set) => ({
  currentChatId: null,
  setCurrentChatId: (chatId) => set({ currentChatId: chatId }),
}));
