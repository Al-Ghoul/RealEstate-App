import { MutationCache, QueryClient } from "@tanstack/react-query";
import { showMessage } from "react-native-flash-message";
import { XiorError } from "xior";

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      if (error instanceof XiorError) {
        showMessage({
          message: error.response?.data.message,
          type: "warning",
        });
      } else {
        showMessage({
          message: "An error occurred",
          description: error.message,
          type: "danger",
        });
      }
    },
    onSuccess: (data) => {
      const { message } = data as { message: string };
      showMessage({
        message: message,
        type: "success",
      });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24, // 24 hours
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});
