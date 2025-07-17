import handleAPI from "../apis/handleAPI";

export interface DashboardStatistics {
  sales?: any[];
  products: number;
  suppliers: number;
  orders: number;
  totalOrder: number;
  subProduct: number;
  totalSubProduct: number;
  totalQty: number;
  [key: string]: any; // Allow additional properties
}

export interface TopSellingProduct {
  id: string;
  name: string;
  totalSold: number;
  revenue: number;
}

export interface LowQuantityProduct {
  id: string;
  name: string;
  quantity: number;
  threshold: number;
}

export interface SalesAndPurchaseData {
  date: string;
  sales: number;
  purchase: number;
}

export const statisticService = {
  getDashboardStatistics: async (): Promise<DashboardStatistics> => {
    const response = await handleAPI("/statistics");
    return response.data;
  },

  getTopSellingAndLowQuantity: async (): Promise<{
    topSelling: TopSellingProduct[];
    lowQuantity: LowQuantityProduct[];
  }> => {
    const response = await handleAPI("/statistics/topSellingAndLowQuantity");
    return response.data;
  },

  getSalesAndPurchaseData: async (
    params?: any
  ): Promise<SalesAndPurchaseData[]> => {
    const response = await handleAPI("/statistics/orderPurchase", params);
    return response.data;
  },
};
