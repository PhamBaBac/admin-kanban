import { useState, useCallback } from "react";
import {
  promotionService,
  PromotionCreateRequest,
  PromotionUpdateRequest,
} from "../services/promotionService";
import { PromotionModel } from "../models/PromotionModel";

export const usePromotions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPromotions = useCallback(async (): Promise<PromotionModel[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await promotionService.getPromotions();
      return response;
    } catch (err: any) {
      setError(err.message || "Failed to fetch promotions");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createPromotion = useCallback(
    async (data: PromotionCreateRequest): Promise<PromotionModel> => {
      setLoading(true);
      setError(null);
      try {
        const response = await promotionService.createPromotion(data);
        return response;
      } catch (err: any) {
        setError(err.message || "Failed to create promotion");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updatePromotion = useCallback(
    async (data: PromotionUpdateRequest): Promise<PromotionModel> => {
      setLoading(true);
      setError(null);
      try {
        const response = await promotionService.updatePromotion(data);
        return response;
      } catch (err: any) {
        setError(err.message || "Failed to update promotion");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deletePromotion = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await promotionService.deletePromotion(id);
    } catch (err: any) {
      setError(err.message || "Failed to delete promotion");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    loading,
    error,
  };
};
