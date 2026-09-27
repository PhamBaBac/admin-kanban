import handleAPI from "../apis/handleAPI";

export type NotificationType =
  | "ORDER_NEW"
  | "ORDER_CANCEL"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "SUPPORT_MESSAGE"
  | "NEW_REVIEW"
  | "SYSTEM_ALERT";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface AdminNotification {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  priority: NotificationPriority;
  targetUrl?: string;
  referenceId?: string;
  isRead: boolean;
  readAt?: string;
  recipientRole?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationPageResponse {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  data: AdminNotification[];
}

export interface NotificationStatsResponse {
  total: number;
  unread: number;
  orders: number;
  stock: number;
}

export interface GetNotificationsParams {
  page?: number;
  size?: number;
  type?: NotificationType;
  isRead?: boolean;
  unreadOnly?: boolean;
  search?: string;
}

export const notificationService = {
  /**
   * Lấy danh sách thông báo phân trang và lọc theo trạng thái/loại/từ khóa từ Backend API
   */
  getNotifications: async (
    params?: GetNotificationsParams
  ): Promise<NotificationPageResponse> => {
    const queryParams: Record<string, any> = {
      page: params?.page ?? 1,
      size: params?.size ?? 10,
    };
    if (params?.type) {
      queryParams.type = params.type;
    }
    if (typeof params?.isRead === "boolean") {
      queryParams.isRead = params.isRead;
    }
    if (typeof params?.unreadOnly === "boolean") {
      queryParams.unreadOnly = params.unreadOnly;
    }
    if (params?.search && params.search.trim()) {
      queryParams.search = params.search.trim();
    }

    const response = await handleAPI("/admin/notifications", queryParams);
    return response.data || {
      currentPage: 1,
      totalPages: 1,
      pageSize: 10,
      totalElements: 0,
      data: [],
    };
  },

  /**
   * Lấy số lượng thống kê thông báo tổng quan từ database
   */
  getStats: async (): Promise<NotificationStatsResponse> => {
    const response = await handleAPI("/admin/notifications/stats");
    return (
      response.data || {
        total: 0,
        unread: 0,
        orders: 0,
        stock: 0,
      }
    );
  },

  /**
   * Lấy số lượng thông báo chưa đọc
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await handleAPI("/admin/notifications/unread-count");
    return typeof response.data === "number" ? response.data : 0;
  },

  /**
   * Đánh dấu 1 thông báo là đã đọc
   */
  markAsRead: async (id: string): Promise<AdminNotification> => {
    const response = await handleAPI(`/admin/notifications/${id}/read`, {}, "patch");
    return response.data;
  },

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  markAllAsRead: async (): Promise<number> => {
    const response = await handleAPI("/admin/notifications/read-all", {}, "patch");
    return response.data || 0;
  },

  /**
   * Xóa một thông báo theo ID (soft delete)
   */
  deleteNotification: async (id: string): Promise<void> => {
    await handleAPI(`/admin/notifications/${id}`, {}, "delete");
  },

  /**
   * Xóa tất cả các thông báo đã đọc
   */
  clearAllRead: async (): Promise<number> => {
    const response = await handleAPI("/admin/notifications/clear-all", {}, "delete");
    return response.data || 0;
  },

  /**
   * Mô phỏng sự kiện thông báo thử nghiệm (ORDER_NEW, ORDER_CANCEL, LOW_STOCK, OUT_OF_STOCK, SUPPORT_MESSAGE, NEW_REVIEW)
   */
  simulateEvent: async (type: NotificationType): Promise<string> => {
    const response = await handleAPI(`/admin/notifications/simulate?type=${type}`, {}, "post");
    return response.data || "";
  },
};
