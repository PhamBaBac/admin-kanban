import handleAPI from "../apis/handleAPI";

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  data: Order[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export const orderService = {
  getOrders: async (params?: any): Promise<OrderListResponse> => {
    const response = await handleAPI("/orders/all", params);
    return response.data;
  },

  getOrderById: async (id: string): Promise<Order> => {
    const response = await handleAPI(`/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id: string, status: string): Promise<Order> => {
    const response = await handleAPI(
      `/orders/${id}/status`,
      "patch"
    );
    return response.data;
  },

  deleteOrder: async (id: string): Promise<void> => {
    await handleAPI(`/orders/${id}`, undefined, "delete");
  },

  exportOrders: async (data: any): Promise<any> => {
    const response = await handleAPI("/orders/export", data, "post");
    return response.data;
  },
};
