import handleAPI from "../apis/handleAPI";
import { BillModel } from "../models/BillModel";

export type Order = BillModel;

export interface OrderListResponse {
  data: BillModel[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}

export const orderService = {
  getOrders: async (params?: any): Promise<OrderListResponse> => {
    const response = await handleAPI("/orders/filter", params);
    return response.data;
  },

  getStatusCounts: async (): Promise<Record<string, number>> => {
    const response = await handleAPI("/orders/status-counts");
    return response.data;
  },

  filterOrders: async (params?: any): Promise<OrderListResponse> => {
    const response = await handleAPI("/orders/filter", params);
    return response.data;
  },

  getOrderById: async (id: string): Promise<BillModel> => {
    const response = await handleAPI(`/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (
    id: string,
    status: string,
    cancelReason?: string,
    trackingCode?: string
  ): Promise<BillModel> => {
    const response = await handleAPI(
      `/orders/${id}/status`,
      { orderStatus: status, cancelReason, trackingCode },
      "patch"
    );
    return response.data;
  },

  getOrderTracking: async (orderId: string): Promise<any> => {
    const response: any = await handleAPI(`/shipping/order/${orderId}`);
    return response?.data !== undefined ? response.data : response;
  },

  getTrackingByCode: async (trackingCode: string): Promise<any> => {
    const response: any = await handleAPI(`/shipping/tracking/${trackingCode}`);
    return response?.data !== undefined ? response.data : response;
  },

  deleteOrder: async (id: string): Promise<void> => {
    await handleAPI(`/orders/${id}`, undefined, "delete");
  },

  exportOrders: async (data: any): Promise<any> => {
    const response = await handleAPI("/orders/export", data, "post");
    return response.data;
  },

  getOrderStatusHistory: async (orderId: string): Promise<any[]> => {
    const response = await handleAPI(`/orders/${orderId}/status-history`);
    return response.data;
  },

  getOrderTransactions: async (orderId: string): Promise<any[]> => {
    const response = await handleAPI(`/orders/${orderId}/transactions`);
    return response.data;
  },

  getAdminTransactions: async (params?: { page?: number; pageSize?: number }): Promise<any> => {
    const response = await handleAPI("/orders/admin/transactions", params);
    return response.data;
  },
};
