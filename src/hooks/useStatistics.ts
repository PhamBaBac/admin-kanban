import { useState, useCallback } from "react";
import {
  statisticService,
  DashboardStatistics,
  TopSellingProduct,
  LowQuantityProduct,
  SalesAndPurchaseData,
} from "../services/statisticService";

export const useStatistics = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDashboardStatistics =
    useCallback(async (): Promise<DashboardStatistics> => {
      setLoading(true);
      setError(null);
      try {
        const response = await statisticService.getDashboardStatistics();
        return response;
      } catch (err: any) {
        setError(err.message || "Failed to fetch dashboard statistics");
        throw err;
      } finally {
        setLoading(false);
      }
    }, []);

  const getTopSellingAndLowQuantity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await statisticService.getTopSellingAndLowQuantity();
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to fetch top selling and low quantity");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSalesAndPurchaseData = useCallback(
    async (params?: any): Promise<SalesAndPurchaseData[]> => {
      setLoading(true);
      setError(null);
      try {
        const response = await statisticService.getSalesAndPurchaseData(params);
        return response;
      } catch (err: any) {
        setError(err.message || "Failed to fetch sales and purchase data");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    getDashboardStatistics,
    getTopSellingAndLowQuantity,
    getSalesAndPurchaseData,
    loading,
    error,
  };
};
