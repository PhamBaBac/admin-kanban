import { useState, useCallback } from "react";
import {
  supportService,
  SupportMessage,
} from "../services/supportService";

export const useChatMessage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHistory = useCallback(
    async (conversationId: string): Promise<SupportMessage[]> => {
      setLoading(true);
      setError(null);
      try {
        return await supportService.getHistory(conversationId);
      } catch (err: any) {
        setError(err.message || "Failed to fetch history");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );
  return {
    getHistory,
    loading,
    error,
  };
};
