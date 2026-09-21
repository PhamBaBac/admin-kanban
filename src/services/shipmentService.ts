import handleAPI from "../apis/handleAPI";
import { ShipmentModel } from "../models/BillModel";

export interface CreateShipmentPayload {
  orderId: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  codAmount?: number;
  note?: string;
  requiredNote?: string;
  items: {
    orderItemId: string;
    quantity: number;
  }[];
}

export interface CalculateFeePayload {
  orderId?: string;
  toDistrictId?: number;
  toWardCode?: string;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  insuranceValue?: number;
}

export const shipmentService = {
  createShipment: async (payload: CreateShipmentPayload): Promise<ShipmentModel> => {
    const res: any = await handleAPI("/shipments/create", payload, "post");
    return res?.data?.data || res?.data;
  },

  getShipmentsByOrderId: async (orderId: string): Promise<ShipmentModel[]> => {
    const res: any = await handleAPI(`/shipments/order/${orderId}`, null, "get");
    return res?.data?.data || res?.data || [];
  },

  getShipmentsPage: async (params: { page?: number; pageSize?: number; status?: string; search?: string }) => {
    const res: any = await handleAPI("/shipments/page", params, "get");
    const pageData = res?.data !== undefined ? res.data : res;
    return pageData;
  },

  getShipments: async (params?: { page?: number; pageSize?: number; size?: number; status?: string; search?: string }) => {
    const queryParams = {
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? params?.size ?? 20,
      status: params?.status,
      search: params?.search,
    };
    const res: any = await handleAPI("/shipments/page", queryParams, "get");
    const result = res?.data !== undefined ? res.data : res;
    if (result && !result.content && Array.isArray(result.data)) {
      result.content = result.data;
    }
    return result;
  },

  calculateFee: async (payload: CalculateFeePayload): Promise<number> => {
    const res: any = await handleAPI("/shipments/calculate-fee", payload, "post");
    return res?.data?.data || res?.data || 30000;
  },
};
