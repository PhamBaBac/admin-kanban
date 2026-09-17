import handleAPI from "../apis/handleAPI";
import { PromotionModel } from "../models/PromotionModel";

export interface PromotionCreateRequest {
  title: string;
  description: string;
  code: string;
  value: number;
  numOfAvailable: number;
  type: string;
  startAt: string;
  endAt: string;
  imageURL: string;
}

export interface PromotionUpdateRequest
  extends Partial<PromotionCreateRequest> {
  id: string;
}

export const promotionService = {
  getPromotions: async (): Promise<PromotionModel[]> => {
    const response = await handleAPI("/promotions");
    if (Array.isArray(response)) {
      return response;
    }
    return Array.isArray(response?.data) ? response.data : [];
  },

  getPromotionById: async (id: string): Promise<PromotionModel> => {
    const response = await handleAPI(`/promotions/${id}`);
    return response?.data || response;
  },

  createPromotion: async (
    data: PromotionCreateRequest
  ): Promise<PromotionModel> => {
    const response = await handleAPI("/promotions/addNew", data, "post");
    return response?.data || response;
  },

  updatePromotion: async (
    data: PromotionUpdateRequest
  ): Promise<PromotionModel> => {
    const response = await handleAPI(`/promotions/${data.id}`, data, "put");
    return response.data;
  },

  deletePromotion: async (id: string): Promise<void> => {
    await handleAPI(`/promotions/${id}`, undefined, "delete");
  },
};
