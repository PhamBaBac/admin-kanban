import handleAPI from "../apis/handleAPI";

export interface SupportMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  receiverId?: string;
  username: string;
  avatar?: string;
  role: "USER" | "ADMIN" | "MANAGER";
  content: string;
  status: "PENDING" | "SENT" | "ANSWERED" | "READ";
  createdAt: string;
}

export interface SendMessageRequest {
  conversationId?: string;
  senderId: string;
  receiverId?: string;
  username: string;
  avatar?: string;
  role: "USER" | "ADMIN" | "MANAGER";
  content: string;
}

export interface ConversationSummary {
  conversationId: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  lastSenderRole: "USER" | "ADMIN" | "MANAGER";
  unreadCount: number;
}

export const supportService = {
  /**
   * Lấy lịch sử tin nhắn của cuộc hội thoại
   */
  getHistory: async (conversationId: string): Promise<SupportMessage[]> => {
    const response = await handleAPI(`/support/historyMessage/${conversationId}`);
    return response.data || [];
  },

  /**
   * Lấy danh sách ID các cuộc hội thoại
   */
  getConversations: async (): Promise<string[]> => {
    const response = await handleAPI("/support/conversations");
    return response.data || [];
  },

  /**
   * Lấy danh sách tóm tắt các cuộc hội thoại kèm thông tin khách hàng, tin nhắn cuối, unread
   */
  getConversationSummaries: async (): Promise<ConversationSummary[]> => {
    const response = await handleAPI("/support/conversations/summary");
    return response.data || [];
  },

  /**
   * Gửi tin nhắn qua REST API (fallback hoặc song song với Socket)
   */
  sendMessage: async (data: SendMessageRequest): Promise<SupportMessage> => {
    const response = await handleAPI("/support/save", data, "post");
    return response.data;
  },

  /**
   * Đánh dấu cuộc trò chuyện đã đọc
   */
  markAsRead: async (conversationId: string): Promise<any> => {
    const response = await handleAPI(`/support/markAsRead/${conversationId}`, {}, "put");
    return response.data;
  },
};
