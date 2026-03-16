import handleAPI from "../apis/handleAPI";

export interface SupportMessage {
  id: number;
  senderId: string;
  receiverId?: string;
  username: string;
  avatar?: string;
  role: "USER" | "ADMIN" | "MANAGER";
  content: string;
  status: "PENDING" | "SENT" | "ANSWERED" | "READ";
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageRequest {
  senderId: string;
  receiverId?: string;
  username: string;
  avatar?: string;
  role: "USER" | "ADMIN" | "MANAGER";
  content: string;
}

export const supportService = {
  /**
   * Lấy lịch sử tin nhắn của user
   */
  getHistory: async (conversationId: string): Promise<SupportMessage[]> => {
    const response = await handleAPI(
      `/support/historyMessage/${conversationId}`
    );
    return response.data;
  },

  getConversations: async (): Promise<any[]> => {
    const response = await handleAPI("/support/conversations");
    return response.data;
  },

  markAsRead: async (conversationId: string): Promise<any> =>
    await handleAPI("/support/markAsRead"),
};
